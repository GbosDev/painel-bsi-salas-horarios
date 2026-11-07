package br.unirio.painel.oferta.aplicacao;

import br.unirio.painel.auditoria.aplicacao.RepositorioDeAuditoria;
import br.unirio.painel.auditoria.dominio.Autor;
import br.unirio.painel.auditoria.dominio.RegistroDeAuditoria;
import br.unirio.painel.auditoria.dominio.TipoDeAlteracao;
import br.unirio.painel.catalogo.aplicacao.RepositorioDeCatalogo;
import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.compartilhado.Textos;
import br.unirio.painel.oferta.dominio.DiferencaDeTurma;
import br.unirio.painel.oferta.dominio.DisciplinaDaMatriz;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import br.unirio.painel.oferta.dominio.Origem;
import br.unirio.painel.oferta.dominio.Secao;
import br.unirio.painel.oferta.dominio.Turma;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Correções pontuais e urgentes (edição, criação e exclusão de turma). Todo ajuste exige motivo
 * e gera um registro de auditoria com o antes/depois.
 */
@Service
public class AjusteExcepcional {

    public static final int MOTIVO_MINIMO = 8;

    public record DadosDeAjuste(String professor, String sala, int vagas, List<HorarioDeAula> horarios, Integer versaoEsperada) { }

    public record DadosDeNovaTurma(String sigla, String disciplina, String codigo, String periodo,
                                   String professor, String sala, int vagas, List<HorarioDeAula> horarios) { }

    public record Resultado(Turma turma, List<String> avisos) { }

    private final RepositorioDeTurmas turmas;
    private final RepositorioDeCatalogo catalogo;
    private final RepositorioDeAuditoria auditoria;
    private final Clock relogio;

    public AjusteExcepcional(RepositorioDeTurmas turmas, RepositorioDeCatalogo catalogo,
                             RepositorioDeAuditoria auditoria, Clock relogio) {
        this.turmas = turmas;
        this.catalogo = catalogo;
        this.auditoria = auditoria;
        this.relogio = relogio;
    }

    @Transactional
    public Resultado editar(long turmaId, DadosDeAjuste dados, String motivoBruto, Autor autor) {
        String motivo = exigirMotivo(motivoBruto);
        Turma atual = turmas.buscar(turmaId)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("turma_nao_encontrada", "Turma não encontrada."));
        if (dados.versaoEsperada() != null && dados.versaoEsperada() != atual.versao()) {
            throw ErroDeNegocio.conflito("turma_alterada_por_outro",
                    "A turma foi alterada por outra pessoa depois que você abriu a edição. Recarregue e tente de novo.", List.of());
        }
        Curso curso = curso(atual.cursoCodigo());
        exigirSalaDoCatalogo(curso.codigo(), dados.sala());
        Turma nova = atual.comAjuste(dados.professor(), dados.sala(), dados.vagas(), dados.horarios());
        DiferencaDeTurma.Resultado diff = DiferencaDeTurma.entre(atual, nova);
        if (diff.vazia()) {
            throw ErroDeNegocio.invalido("sem_alteracoes", "Nenhum campo foi alterado.");
        }
        List<String> avisos = avisosDeSala(nova);
        Turma gravada = turmas.salvar(nova);
        auditoria.registrar(new RegistroDeAuditoria(null, relogio.instant(), autor, curso.codigo(), curso.nome(),
                TipoDeAlteracao.EXCEPCIONAL_EDICAO, gravada.id(), sigla(gravada), nome(gravada), motivo,
                diff.antes(), diff.depois(), null));
        return new Resultado(gravada, avisos);
    }

    @Transactional
    public Resultado criar(String cursoCodigo, DadosDeNovaTurma dados, String motivoBruto, Autor autor) {
        String motivo = exigirMotivo(motivoBruto);
        Curso curso = curso(cursoCodigo);
        if (dados.horarios() == null || dados.horarios().isEmpty()) {
            throw ErroDeNegocio.invalido("horario_obrigatorio", "Informe ao menos um horário para a nova turma.");
        }
        exigirSalaDoCatalogo(curso.codigo(), dados.sala());
        DisciplinaDaMatriz disciplina = new DisciplinaDaMatriz(2023, dados.sigla(), dados.codigo(), dados.disciplina(), dados.periodo(), false);
        Turma nova = new Turma(null, curso.codigo(), disciplina, null, dados.professor(), dados.sala(), dados.vagas(),
                Secao.REGULAR, null, Origem.EXCEPCIONAL, 0, dados.horarios());
        List<String> avisos = avisosDeSala(nova);
        Turma gravada = turmas.salvar(nova);
        auditoria.registrar(new RegistroDeAuditoria(null, relogio.instant(), autor, curso.codigo(), curso.nome(),
                TipoDeAlteracao.EXCEPCIONAL_CRIACAO, gravada.id(), sigla(gravada), nome(gravada), motivo,
                java.util.Map.of(), DiferencaDeTurma.resumo(gravada), null));
        return new Resultado(gravada, avisos);
    }

    @Transactional
    public void excluir(long turmaId, String motivoBruto, Autor autor) {
        String motivo = exigirMotivo(motivoBruto);
        Turma atual = turmas.buscar(turmaId)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("turma_nao_encontrada", "Turma não encontrada."));
        Curso curso = curso(atual.cursoCodigo());
        turmas.marcarComoExcluida(turmaId, relogio.instant());
        auditoria.registrar(new RegistroDeAuditoria(null, relogio.instant(), autor, curso.codigo(), curso.nome(),
                TipoDeAlteracao.EXCEPCIONAL_EXCLUSAO, turmaId, sigla(atual), nome(atual), motivo,
                DiferencaDeTurma.resumo(atual), java.util.Map.of(), null));
    }

    private String exigirMotivo(String bruto) {
        String motivo = Textos.limpar(bruto);
        if (motivo.length() < MOTIVO_MINIMO) {
            throw ErroDeNegocio.invalido("motivo_obrigatorio", "Descreva o motivo (mínimo de " + MOTIVO_MINIMO + " caracteres).");
        }
        if (motivo.length() > 500) {
            throw ErroDeNegocio.invalido("motivo_longo", "O motivo deve ter no máximo 500 caracteres.");
        }
        return motivo;
    }

    private Curso curso(String codigo) {
        return catalogo.curso(codigo)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("curso_nao_encontrado", "Curso não encontrado: " + codigo));
    }

    private void exigirSalaDoCatalogo(String cursoCodigo, String sala) {
        if (Textos.vazio(sala)) return;
        if (!catalogo.salaExisteNoCurso(cursoCodigo, Textos.limpar(sala))) {
            throw ErroDeNegocio.invalido("sala_fora_do_catalogo",
                    "A sala \"" + Textos.limpar(sala) + "\" não está no catálogo do curso. Adicione-a antes de usá-la.");
        }
    }

    /** Aviso (não bloqueia): outra turma do curso, com outro docente, usa a mesma sala em horário que se cruza. */
    private List<String> avisosDeSala(Turma nova) {
        List<String> avisos = new ArrayList<>();
        if (nova.sala() == null) return avisos;
        for (Turma outra : turmas.listarDoCurso(nova.cursoCodigo())) {
            if (outra.id() != null && outra.id().equals(nova.id())) continue;
            if (!nova.sala().equals(outra.sala())) continue;
            if (nova.professor() != null && outra.professor() != null
                    && Textos.chaveDeDocente(nova.professor()).equals(Textos.chaveDeDocente(outra.professor()))) continue;
            boolean cruza = nova.horarios().stream().anyMatch(h -> outra.horarios().stream().anyMatch(h::sobrepoe));
            if (cruza) avisos.add("A sala " + nova.sala() + " já é usada por " + outra.rotulo() + " em horário que se cruza.");
        }
        return avisos;
    }

    private static String sigla(Turma t) { return t.disciplinaPrincipal().sigla(); }

    private static String nome(Turma t) { return t.disciplinaPrincipal().nome(); }
}
