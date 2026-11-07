package br.unirio.painel.apoio;

import br.unirio.painel.acesso.aplicacao.CodificadorDeSenha;
import br.unirio.painel.acesso.aplicacao.RepositorioDeUsuarios;
import br.unirio.painel.acesso.dominio.Usuario;
import br.unirio.painel.auditoria.aplicacao.RepositorioDeAuditoria;
import br.unirio.painel.auditoria.dominio.RegistroDeAuditoria;
import br.unirio.painel.catalogo.aplicacao.RepositorioDeCatalogo;
import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.catalogo.dominio.SalaDoCatalogo;
import br.unirio.painel.compartilhado.Textos;
import br.unirio.painel.importacao.aplicacao.RepositorioDeLotes;
import br.unirio.painel.importacao.dominio.LinhaAnalisada;
import br.unirio.painel.oferta.aplicacao.RepositorioDeTurmas;
import br.unirio.painel.oferta.dominio.Turma;
import br.unirio.painel.plano.aplicacao.RepositorioDePlanos;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

/** Implementações em memória das portas de saída, usadas nos testes da camada de aplicação. */
public final class FakesEmMemoria {

    private FakesEmMemoria() { }

    public static Clock relogioFixo() {
        return Clock.fixed(Instant.parse("2026-10-25T20:00:00Z"), ZoneOffset.UTC);
    }

    public static Curso cursoBsi() {
        return new Curso("bsi", "BSI", "Sistemas de Informação", "CCET", "Centro de Ciências Exatas e Tecnologia", null,
                "completo", "Grade completa", "padrao", true, 2);
    }

    public static class Catalogo implements RepositorioDeCatalogo {
        public final Map<String, Curso> cursos = new LinkedHashMap<>();
        public final Map<String, Set<String>> salas = new LinkedHashMap<>();
        public Turmas turmas;
        private final AtomicLong seq = new AtomicLong(100);

        public Catalogo() {
            cursos.put("bsi", cursoBsi());
            salas.put("bsi", new LinkedHashSet<>(List.of("Lab. 1", "Sala 212")));
        }

        @Override public List<Curso> cursos() { return new ArrayList<>(cursos.values()); }
        @Override public Optional<Curso> curso(String codigo) { return Optional.ofNullable(cursos.get(codigo)); }
        @Override public List<SalaDoCatalogo> salasDoCurso(String c) {
            List<SalaDoCatalogo> out = new ArrayList<>();
            for (String s : salas.getOrDefault(c, Set.of())) out.add(new SalaDoCatalogo(idDa(s), s, emUso(c, s)));
            return out;
        }
        @Override public boolean salaExisteNoCurso(String c, String nome) { return salas.getOrDefault(c, Set.of()).contains(nome); }
        @Override public boolean adicionarSala(String c, String nome) { return salas.computeIfAbsent(c, k -> new LinkedHashSet<>()).add(nome); }
        @Override public Optional<SalaDoCatalogo> salaDoCurso(String c, long id) {
            return salasDoCurso(c).stream().filter(s -> s.id() == id).findFirst();
        }
        @Override public void removerSalaDoCurso(String c, long id) {
            salaDoCurso(c, id).ifPresent(s -> salas.get(c).remove(s.nome()));
        }
        public long idDa(String nome) { return 1000 + Math.abs(nome.hashCode() % 1000); }
        private long emUso(String c, String sala) {
            return turmas == null ? 0 : turmas.listarDoCurso(c).stream().filter(t -> sala.equals(t.sala())).count();
        }
    }

    public static class Turmas implements RepositorioDeTurmas {
        public final Map<Long, Turma> porId = new LinkedHashMap<>();
        public final Set<Long> excluidas = new LinkedHashSet<>();
        public final Map<String, Ementa> ementas = new LinkedHashMap<>();
        private final AtomicLong seq = new AtomicLong(0);

        @Override public String periodoVigente() { return "2026/2"; }
        @Override public List<Turma> listarDoCurso(String c) {
            return porId.values().stream().filter(t -> t.cursoCodigo().equals(c) && !excluidas.contains(t.id())).toList();
        }
        @Override public Optional<Turma> buscar(long id) { return excluidas.contains(id) ? Optional.empty() : Optional.ofNullable(porId.get(id)); }
        @Override public List<Turma> listarPorSigla(String c, int matriz, String sigla) {
            return listarDoCurso(c).stream().filter(t -> {
                var d = matriz == 2008 ? t.disciplina2008() : t.disciplina2023();
                return d != null && Textos.normalizar(d.sigla()).equals(Textos.normalizar(sigla));
            }).toList();
        }
        @Override public Turma salvar(Turma t) {
            long id = t.id() == null ? seq.incrementAndGet() : t.id();
            Turma gravada = new Turma(id, t.cursoCodigo(), t.disciplina2023(), t.disciplina2008(), t.professor(), t.sala(),
                    t.vagas(), t.secao(), t.ementaUrl(), t.origem(), t.id() == null ? 0 : t.versao() + 1, t.horarios());
            porId.put(id, gravada);
            return gravada;
        }
        @Override public void marcarComoExcluida(long id, Instant quando) { excluidas.add(id); }
        @Override public Optional<Ementa> buscarEmenta(String codigo) { return Optional.ofNullable(ementas.get(codigo)); }
    }

    public static class Auditoria implements RepositorioDeAuditoria {
        public final List<RegistroDeAuditoria> registros = new ArrayList<>();
        @Override public void registrar(RegistroDeAuditoria r) { registros.add(r); }
        @Override public List<RegistroDeAuditoria> consultar(FiltroDeAuditoria f) { return registros; }
    }

    public static class Lotes implements RepositorioDeLotes {
        public final Map<Long, Lote> lotes = new LinkedHashMap<>();
        public final Map<Long, Situacao> situacoes = new LinkedHashMap<>();
        public final Map<String, Instant> aplicadosPorHash = new LinkedHashMap<>();
        private final AtomicLong seq = new AtomicLong(0);

        @Override public long criarPrevia(NovoLote n, List<LinhaAnalisada> linhas) {
            long id = seq.incrementAndGet();
            lotes.put(id, new Lote(id, n.cursoCodigo(), n.nomeArquivo(), n.hashSha256(), Situacao.PREVIA,
                    n.totalLinhas(), n.totalOk(), n.totalAviso(), n.totalErro(), linhas));
            situacoes.put(id, Situacao.PREVIA);
            return id;
        }
        @Override public Optional<Lote> buscar(long id) {
            Lote l = lotes.get(id);
            if (l == null) return Optional.empty();
            return Optional.of(new Lote(l.id(), l.cursoCodigo(), l.nomeArquivo(), l.hashSha256(), situacoes.get(id),
                    l.totalLinhas(), l.totalOk(), l.totalAviso(), l.totalErro(), l.linhas()));
        }
        @Override public void marcarAplicado(long id, String obs, int criadas, int atualizadas, Instant quando) {
            situacoes.put(id, Situacao.APLICADO);
            aplicadosPorHash.put(lotes.get(id).hashSha256(), quando);
        }
        @Override public Optional<Instant> aplicadoAnteriormente(String hash, String curso) { return Optional.ofNullable(aplicadosPorHash.get(hash)); }
    }

    public static class Planos implements RepositorioDePlanos {
        public final Map<String, PlanoSalvo> salvos = new LinkedHashMap<>();
        @Override public Optional<PlanoSalvo> buscar(long u, String c) { return Optional.ofNullable(salvos.get(u + "|" + c)); }
        @Override public void substituir(long u, String c, List<Long> ids, Instant q) { salvos.put(u + "|" + c, new PlanoSalvo(ids, q)); }
    }

    public static class Usuarios implements RepositorioDeUsuarios {
        public final Map<Long, Usuario> porId = new LinkedHashMap<>();
        private final AtomicLong seq = new AtomicLong(0);
        @Override public Optional<Usuario> buscarPorLogin(String l) { return porId.values().stream().filter(u -> u.login().equals(l)).findFirst(); }
        @Override public Optional<Usuario> buscarPorMatricula(String m) { return porId.values().stream().filter(u -> m.equals(u.matricula())).findFirst(); }
        @Override public Optional<Usuario> buscarPorId(long id) { return Optional.ofNullable(porId.get(id)); }
        @Override public List<Usuario> listar() { return new ArrayList<>(porId.values()); }
        @Override public long contar() { return porId.size(); }
        @Override public boolean existeAdministrador() { return porId.values().stream().anyMatch(Usuario::administrador); }
        @Override public Usuario salvar(Usuario u) {
            if (u.id() != null) { porId.put(u.id(), u); return u; }
            Usuario novo = new Usuario(seq.incrementAndGet(), u.login(), u.nome(), u.senhaHash(), u.perfil(), u.matricula(),
                    u.ativo(), u.administrador(), u.tentativasFalhas(), u.bloqueadoAte());
            porId.put(novo.id(), novo);
            return novo;
        }
        @Override public void marcarComoAdministrador(long id) {
            Usuario u = porId.get(id);
            porId.put(id, new Usuario(u.id(), u.login(), u.nome(), u.senhaHash(), u.perfil(), u.matricula(), u.ativo(), true,
                    u.tentativasFalhas(), u.bloqueadoAte()));
        }
        @Override public void excluir(long id) { porId.remove(id); }
    }

    /** Codificador de mentira: apenas para testes (nunca usado em produção). */
    public static class CodificadorFalso implements CodificadorDeSenha {
        @Override public String codificar(String s) { return "hash(" + s + ")"; }
        @Override public boolean confere(String s, String h) { return h.equals("hash(" + s + ")"); }
    }
}
