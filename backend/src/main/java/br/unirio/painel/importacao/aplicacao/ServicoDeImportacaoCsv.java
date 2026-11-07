package br.unirio.painel.importacao.aplicacao;

import br.unirio.painel.auditoria.aplicacao.RepositorioDeAuditoria;
import br.unirio.painel.auditoria.dominio.Autor;
import br.unirio.painel.auditoria.dominio.RegistroDeAuditoria;
import br.unirio.painel.auditoria.dominio.TipoDeAlteracao;
import br.unirio.painel.catalogo.aplicacao.RepositorioDeCatalogo;
import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.compartilhado.Textos;
import br.unirio.painel.importacao.aplicacao.RepositorioDeLotes.Lote;
import br.unirio.painel.importacao.aplicacao.RepositorioDeLotes.NovoLote;
import br.unirio.painel.importacao.dominio.AnalisadorDeCsv;
import br.unirio.painel.importacao.dominio.LeitorDeCsv;
import br.unirio.painel.importacao.dominio.LinhaAnalisada;
import br.unirio.painel.importacao.dominio.LinhaAnalisada.Situacao;
import br.unirio.painel.importacao.dominio.RegistroImportado;
import br.unirio.painel.oferta.aplicacao.RepositorioDeTurmas;
import br.unirio.painel.oferta.dominio.DiferencaDeTurma;
import br.unirio.painel.oferta.dominio.Origem;
import br.unirio.painel.oferta.dominio.Secao;
import br.unirio.painel.oferta.dominio.Turma;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Importação de turmas por planilha CSV em duas etapas: prévia (nada é gravado nas turmas) e aplicação
 * (transacional, uma auditoria por turma alterada). O destino (curso) é escolhido na tela, não no arquivo.
 *
 * <p>A prévia e a aplicação usam o MESMO planejamento ({@link #planejar}): para cada linha, localiza a turma real
 * (coluna id → sigla da grade atual → sigla da grade antiga), mescla, valida e diz se vai CRIAR, ATUALIZAR ou não mudar
 * nada. Assim, o que a prévia mostra é exatamente o que a aplicação faz — e erros aparecem antes, não no meio da gravação.
 */
@Service
public class ServicoDeImportacaoCsv {

    /** O que a aplicação fará com cada linha. */
    public enum Acao {
        CRIAR("criar"), ATUALIZAR("atualizar"), SEM_ALTERACAO("sem_alteracao");

        private final String codigo;

        Acao(String codigo) { this.codigo = codigo; }

        public String codigo() { return codigo; }
    }

    public record Previa(long loteId, String nomeArquivo, boolean formatoDuplo, int totalLinhas, int totalOk,
                         int totalAviso, int totalErro, int totalCriar, int totalAtualizar, int totalSemAlteracao,
                         List<LinhaAnalisada> linhas, Map<Integer, Acao> acoes, String avisoGeral) { }

    public record ResultadoDaAplicacao(long loteId, int criadas, int atualizadas, int semAlteracao, int salasCriadas) { }

    /** Plano de uma linha: a linha (com avisos/erros do planejamento), a ação e a turma resultante. */
    record Plano(LinhaAnalisada linha, Acao acao, Turma antes, Turma depois) { }

    private final RepositorioDeCatalogo catalogo;
    private final RepositorioDeTurmas turmas;
    private final RepositorioDeLotes lotes;
    private final RepositorioDeAuditoria auditoria;
    private final Clock relogio;
    private final LimitesDeImportacao limites;

    public ServicoDeImportacaoCsv(RepositorioDeCatalogo catalogo, RepositorioDeTurmas turmas, RepositorioDeLotes lotes,
                                  RepositorioDeAuditoria auditoria, Clock relogio, LimitesDeImportacao limites) {
        this.catalogo = catalogo;
        this.turmas = turmas;
        this.lotes = lotes;
        this.auditoria = auditoria;
        this.relogio = relogio;
        this.limites = limites;
    }

    @Transactional
    public Previa gerarPrevia(String cursoCodigo, String nomeArquivo, byte[] conteudo, Autor autor) {
        Curso curso = curso(cursoCodigo);
        if (conteudo == null || conteudo.length == 0) {
            throw ErroDeNegocio.invalido("csv_vazio", "Arquivo vazio ou ilegível.");
        }
        if (conteudo.length > limites.tamanhoMaximoBytes()) {
            throw ErroDeNegocio.invalido("csv_grande_demais", "O arquivo excede o limite de " + (limites.tamanhoMaximoBytes() / 1024) + " KB.");
        }
        String nome = nomeArquivo == null ? "planilha.csv" : Textos.limpar(nomeArquivo);
        if (!nome.toLowerCase().endsWith(".csv")) {
            throw ErroDeNegocio.invalido("csv_extensao_invalida", "Envie um arquivo com extensão .csv.");
        }
        String texto = LeitorDeCsv.decodificar(conteudo);
        AnalisadorDeCsv.Analise analise = AnalisadorDeCsv.analisar(LeitorDeCsv.ler(texto), curso.duracaoAulaHoras(), limites.linhasMaximas());

        List<Plano> planos = planejar(curso, analise.linhas());
        List<LinhaAnalisada> linhas = planos.stream().map(Plano::linha).toList();
        Map<Integer, Acao> acoes = new LinkedHashMap<>();
        for (Plano p : planos) if (p.acao() != null) acoes.put(p.linha().numero(), p.acao());

        int ok = contar(linhas, Situacao.OK), aviso = contar(linhas, Situacao.AVISO), erro = contar(linhas, Situacao.ERRO);
        String hash = sha256(conteudo);
        List<String> avisos = new ArrayList<>();
        lotes.aplicadoAnteriormente(hash, cursoCodigo).ifPresent(quando ->
                avisos.add("Este mesmo arquivo já foi aplicado neste curso em " + quando + "."));
        if (!analise.colunasIgnoradas().isEmpty()) {
            avisos.add("Colunas ignoradas (nome não reconhecido): " + String.join(", ", analise.colunasIgnoradas())
                    + ". Confira os nomes no modelo.");
        }
        long id = lotes.criarPrevia(new NovoLote(cursoCodigo, autor.usuarioId(), nome, hash, linhas.size(), ok, aviso, erro), linhas);
        return new Previa(id, nome, analise.dual(), linhas.size(), ok, aviso, erro,
                contarAcao(acoes, Acao.CRIAR), contarAcao(acoes, Acao.ATUALIZAR), contarAcao(acoes, Acao.SEM_ALTERACAO),
                linhas, acoes, avisos.isEmpty() ? null : String.join(" ", avisos));
    }

    @Transactional
    public ResultadoDaAplicacao aplicar(long loteId, String observacao, Autor autor) {
        Lote lote = lotes.buscar(loteId)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("lote_nao_encontrado", "Importação não encontrada."));
        if (lote.situacao() != RepositorioDeLotes.Situacao.PREVIA) {
            throw ErroDeNegocio.conflito("lote_ja_aplicado", "Esta importação já foi aplicada ou descartada.", List.of());
        }
        Curso curso = curso(lote.cursoCodigo());
        String motivo = Textos.vazio(observacao) ? "Importação por planilha CSV" : Textos.limpar(observacao);
        if (motivo.length() > 500) motivo = motivo.substring(0, 500);

        // Replaneja com o estado ATUAL do banco: se algo mudou desde a prévia e uma linha deixou de ser aplicável,
        // nada é gravado e o professor gera uma nova prévia (em vez de gravar meio lote).
        List<LinhaAnalisada> aplicaveis = lote.linhas().stream().filter(LinhaAnalisada::aplicavel).toList();
        List<Plano> planos = planejar(curso, aplicaveis);
        List<String> quebradas = planos.stream().filter(p -> !p.linha().aplicavel())
                .map(p -> "Linha " + p.linha().numero() + ": " + p.linha().mensagem()).toList();
        if (!quebradas.isEmpty()) {
            throw ErroDeNegocio.conflito("previa_desatualizada",
                    "As turmas mudaram desde a prévia. Envie o arquivo de novo para gerar uma prévia atualizada.", quebradas);
        }

        int criadas = 0, atualizadas = 0, semAlteracao = 0, salasCriadas = 0;
        for (Plano p : planos) {
            if (p.acao() == Acao.SEM_ALTERACAO) { semAlteracao++; continue; }
            String sala = p.depois().sala();
            if (sala != null && !catalogo.salaExisteNoCurso(curso.codigo(), sala)) {
                catalogo.adicionarSala(curso.codigo(), sala);
                salasCriadas++;
                auditoria.registrar(new RegistroDeAuditoria(null, relogio.instant(), autor, curso.codigo(), curso.nome(),
                        TipoDeAlteracao.SALA_ADICIONADA, null, "—", "Catálogo de salas", "Sala criada pela importação #" + loteId,
                        Map.of(), Map.of("sala", sala), loteId));
            }
            Turma gravada = turmas.salvar(p.depois());
            if (p.acao() == Acao.CRIAR) {
                auditoria.registrar(new RegistroDeAuditoria(null, relogio.instant(), autor, curso.codigo(), curso.nome(),
                        TipoDeAlteracao.CSV_CRIADA, gravada.id(), gravada.disciplinaPrincipal().sigla(),
                        gravada.disciplinaPrincipal().nome(), motivo, Map.of(), DiferencaDeTurma.resumo(gravada), loteId));
                criadas++;
            } else {
                DiferencaDeTurma.Resultado diff = DiferencaDeTurma.entre(p.antes(), p.depois());
                auditoria.registrar(new RegistroDeAuditoria(null, relogio.instant(), autor, curso.codigo(), curso.nome(),
                        TipoDeAlteracao.CSV_ATUALIZADA, gravada.id(), gravada.disciplinaPrincipal().sigla(),
                        gravada.disciplinaPrincipal().nome(), motivo, diff.antes(), diff.depois(), loteId));
                atualizadas++;
            }
        }
        lotes.marcarAplicado(loteId, motivo, criadas, atualizadas, relogio.instant());
        return new ResultadoDaAplicacao(loteId, criadas, atualizadas, semAlteracao, salasCriadas);
    }

    /**
     * Planeja as linhas em ordem, simulando o estado das turmas do curso conforme cada linha seria aplicada
     * (para detectar linhas repetidas e conflitos de sala também entre linhas do próprio arquivo).
     */
    List<Plano> planejar(Curso curso, List<LinhaAnalisada> linhas) {
        String codigo = curso.codigo();
        Map<Long, Turma> estado = new LinkedHashMap<>();
        for (Turma t : turmas.listarDoCurso(codigo)) estado.put(t.id(), t);
        List<Turma> novas = new ArrayList<>();
        Map<String, Integer> alvoJaUsado = new HashMap<>();
        Map<String, Boolean> salaNoCatalogo = new HashMap<>();
        List<Plano> planos = new ArrayList<>();

        for (LinhaAnalisada l : linhas) {
            if (!l.aplicavel()) { planos.add(new Plano(l, null, null, null)); continue; }
            RegistroImportado r = l.registro();
            List<String> avisos = new ArrayList<>();
            if (l.mensagem() != null) avisos.add(l.mensagem());

            Localizacao loc = localizar(codigo, r, estado);
            if (loc.erro() != null) { planos.add(erro(l, loc.erro())); continue; }
            if (loc.aviso() != null) avisos.add(loc.aviso());

            String chaveDoAlvo = loc.turma() != null ? "id:" + loc.turma().id() : "nova:" + chaveDeSigla(r);
            Integer anterior = alvoJaUsado.putIfAbsent(chaveDoAlvo, l.numero());
            if (anterior != null) {
                planos.add(erro(l, "Esta turma já aparece na linha " + anterior + " do arquivo. Cada turma deve aparecer uma vez;"
                        + " para turmas diferentes da mesma disciplina, use a coluna Id."));
                continue;
            }

            Turma antes = loc.turma();
            Turma depois;
            try {
                depois = antes != null ? mesclar(antes, r)
                        : new Turma(null, codigo, r.disciplina2023(), r.disciplina2008(), r.professor(), r.sala(),
                                r.vagas() == null ? 0 : r.vagas(), Secao.deCodigo(r.secao()), null, Origem.CSV, 0, r.horarios());
            } catch (ErroDeNegocio e) {
                planos.add(erro(l, e.getMessage()));
                continue;
            }

            Acao acao;
            if (antes == null) acao = Acao.CRIAR;
            else {
                boolean mudouDisciplina = !Objects.equals(antes.disciplina2008(), depois.disciplina2008())
                        || !Objects.equals(antes.disciplina2023(), depois.disciplina2023()) || antes.secao() != depois.secao();
                acao = DiferencaDeTurma.entre(antes, depois).vazia() && !mudouDisciplina ? Acao.SEM_ALTERACAO : Acao.ATUALIZAR;
            }

            if (acao != Acao.SEM_ALTERACAO) {
                avisos.addAll(conflitosDeSala(depois, estado.values(), novas));
                String sala = depois.sala();
                if (sala != null && !salaNoCatalogo.computeIfAbsent(sala, s -> catalogo.salaExisteNoCurso(codigo, s))) {
                    avisos.add("Sala \"" + sala + "\" não está no catálogo; será adicionada ao aplicar.");
                    salaNoCatalogo.put(sala, true);
                }
            }
            if (antes != null) estado.put(antes.id(), depois); else novas.add(depois);

            Situacao situacao = avisos.isEmpty() ? Situacao.OK : Situacao.AVISO;
            planos.add(new Plano(new LinhaAnalisada(l.numero(), situacao, avisos.isEmpty() ? null : String.join(" · ", avisos), r),
                    acao, antes, depois));
        }
        return planos;
    }

    record Localizacao(Turma turma, String erro, String aviso) { }

    /**
     * Turma existente que a linha atualiza: coluna Id (se for deste curso); senão a sigla da grade atual; senão a da
     * grade antiga (uma linha com as duas grades encontra a turma que só tinha a antiga). Sigla em mais de uma turma
     * do curso é ambígua: a linha precisa da coluna Id.
     */
    private Localizacao localizar(String codigo, RegistroImportado r, Map<Long, Turma> estado) {
        String aviso = null;
        if (r.idTurma() != null) {
            Turma porId = estado.get(r.idTurma());
            if (porId != null) return new Localizacao(porId, null, null);
            aviso = "Id " + r.idTurma() + " não é de uma turma deste curso; a turma foi localizada pela sigla.";
        }
        for (int matriz : new int[] {2023, 2008}) {
            var d = matriz == 2023 ? r.disciplina2023() : r.disciplina2008();
            if (d == null) continue;
            List<Turma> candidatas = turmas.listarPorSigla(codigo, matriz, d.sigla()).stream()
                    .map(t -> estado.getOrDefault(t.id(), t)).toList();
            if (candidatas.size() > 1) {
                return new Localizacao(null, "Há " + candidatas.size() + " turmas com a sigla " + d.sigla()
                        + " neste curso; informe a coluna Id para dizer qual delas atualizar (use a planilha de turmas atuais).", null);
            }
            if (candidatas.size() == 1) return new Localizacao(candidatas.get(0), null, aviso);
        }
        return new Localizacao(null, null, aviso);
    }

    /** Aviso (não bloqueia): outra turma, com outro docente, na mesma sala em horário que se cruza. */
    private static List<String> conflitosDeSala(Turma nova, Iterable<Turma> existentes, List<Turma> novasDoArquivo) {
        List<String> avisos = new ArrayList<>();
        if (nova.sala() == null || nova.horarios().isEmpty()) return avisos;
        List<Turma> outras = new ArrayList<>();
        existentes.forEach(outras::add);
        outras.addAll(novasDoArquivo);
        for (Turma outra : outras) {
            if (nova.id() != null && nova.id().equals(outra.id())) continue;
            if (!Textos.normalizar(nova.sala()).equals(Textos.normalizar(String.valueOf(outra.sala())))) continue;
            if (nova.professor() != null && outra.professor() != null
                    && Textos.chaveDeDocente(nova.professor()).equals(Textos.chaveDeDocente(outra.professor()))) continue;
            boolean cruza = nova.horarios().stream().anyMatch(h -> outra.horarios().stream().anyMatch(h::sobrepoe));
            if (cruza) avisos.add("Conflito de sala: " + nova.sala() + " já é usada por " + outra.rotulo() + " em horário que se cruza.");
        }
        return avisos;
    }

    /** Campos vazios na planilha mantêm o valor atual; horários, quando informados, substituem todos. */
    static Turma mesclar(Turma atual, RegistroImportado r) {
        Turma t = atual.comAjuste(
                r.professor() != null ? r.professor() : atual.professor(),
                r.sala() != null ? r.sala() : atual.sala(),
                r.vagas() != null ? r.vagas() : atual.vagas(),
                r.horarios() != null && !r.horarios().isEmpty() ? r.horarios() : atual.horarios());
        t = t.comDisciplinas(r.disciplina2023() != null ? r.disciplina2023() : atual.disciplina2023(),
                r.disciplina2008() != null ? r.disciplina2008() : atual.disciplina2008());
        return r.secao() != null ? t.comSecao(Secao.deCodigo(r.secao())) : t;
    }

    private static String chaveDeSigla(RegistroImportado r) {
        return r.casarMatriz() + "|" + Textos.normalizar(r.casarSigla());
    }

    private static Plano erro(LinhaAnalisada l, String mensagem) {
        return new Plano(new LinhaAnalisada(l.numero(), Situacao.ERRO, mensagem, null), null, null, null);
    }

    private Curso curso(String codigo) {
        return catalogo.curso(codigo)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("curso_nao_encontrado", "Curso não encontrado: " + codigo));
    }

    private static int contar(List<LinhaAnalisada> linhas, Situacao s) {
        return (int) linhas.stream().filter(l -> l.situacao() == s).count();
    }

    private static int contarAcao(Map<Integer, Acao> acoes, Acao a) {
        return (int) acoes.values().stream().filter(a::equals).count();
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Limites configuráveis (application.yml: bussola.csv.*). */
    public record LimitesDeImportacao(long tamanhoMaximoBytes, int linhasMaximas) { }
}
