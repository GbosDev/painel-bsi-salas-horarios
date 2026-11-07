package br.unirio.painel.oferta.infra;

import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.compartilhado.Textos;
import br.unirio.painel.oferta.aplicacao.RepositorioDeTurmas;
import br.unirio.painel.oferta.dominio.DisciplinaDaMatriz;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import br.unirio.painel.oferta.dominio.Origem;
import br.unirio.painel.oferta.dominio.Secao;
import br.unirio.painel.oferta.dominio.Turma;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

/**
 * Turmas com SQL explícito (JdbcClient): o agregado atravessa seis tabelas e as consultas são
 * verificadas diretamente contra o esquema Flyway. Participa da mesma transação das demais portas.
 */
@Repository
public class RepositorioDeTurmasJdbc implements RepositorioDeTurmas {

    private static final String SELECT_TURMA = """
            SELECT t.id, c.codigo AS curso_codigo, t.versao, t.vagas, t.secao, t.ementa_url, t.aviso, t.origem,
                   d23.matriz AS m23, d23.sigla AS s23, d23.codigo AS c23, d23.nome AS n23, d23.periodo_curricular AS p23, d23.pos_graduacao AS g23,
                   d08.matriz AS m08, d08.sigla AS s08, d08.codigo AS c08, d08.nome AS n08, d08.periodo_curricular AS p08, d08.pos_graduacao AS g08,
                   dc.nome AS docente, sa.nome AS sala
              FROM turma t
              JOIN curso c ON c.id = t.curso_id
              LEFT JOIN disciplina d23 ON d23.id = t.disciplina_2023_id
              LEFT JOIN disciplina d08 ON d08.id = t.disciplina_2008_id
              LEFT JOIN docente dc ON dc.id = t.docente_id
              LEFT JOIN sala sa ON sa.id = t.sala_id
            """;

    private final JdbcClient jdbc;

    public RepositorioDeTurmasJdbc(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String periodoVigente() {
        return jdbc.sql("SELECT codigo FROM periodo_letivo WHERE ativo = TRUE ORDER BY id DESC LIMIT 1")
                .query(String.class).single();
    }

    @Override
    public List<Turma> listarDoCurso(String cursoCodigo) {
        List<LinhaDeTurma> linhas = jdbc.sql(SELECT_TURMA + """
                  JOIN periodo_letivo pl ON pl.id = t.periodo_letivo_id AND pl.ativo = TRUE
                 WHERE c.codigo = :curso AND t.excluida_em IS NULL
                 ORDER BY t.id
                """).param("curso", cursoCodigo).query(this::lerLinha).list();
        Map<Long, List<HorarioDeAula>> horarios = new HashMap<>();
        jdbc.sql("""
                SELECT h.turma_id, h.dia_semana, h.hora_inicio, h.hora_fim
                  FROM turma_horario h
                  JOIN turma t ON t.id = h.turma_id
                  JOIN curso c ON c.id = t.curso_id
                  JOIN periodo_letivo pl ON pl.id = t.periodo_letivo_id AND pl.ativo = TRUE
                 WHERE c.codigo = :curso AND t.excluida_em IS NULL
                 ORDER BY h.turma_id, h.dia_semana, h.hora_inicio
                """).param("curso", cursoCodigo)
                .query((rs, n) -> {
                    horarios.computeIfAbsent(rs.getLong("turma_id"), k -> new ArrayList<>()).add(lerHorario(rs));
                    return 0;
                }).list();
        return linhas.stream().map(l -> l.paraTurma(horarios.getOrDefault(l.id, List.of()))).toList();
    }

    @Override
    public Optional<Turma> buscar(long id) {
        Optional<LinhaDeTurma> linha = jdbc.sql(SELECT_TURMA + " WHERE t.id = :id AND t.excluida_em IS NULL")
                .param("id", id).query(this::lerLinha).optional();
        return linha.map(l -> l.paraTurma(horariosDa(l.id)));
    }

    @Override
    public List<Turma> listarPorSigla(String cursoCodigo, int matriz, String sigla) {
        String coluna = matriz == 2008 ? "t.disciplina_2008_id" : "t.disciplina_2023_id";
        List<Long> ids = jdbc.sql("""
                SELECT t.id FROM turma t
                  JOIN curso c ON c.id = t.curso_id
                  JOIN periodo_letivo pl ON pl.id = t.periodo_letivo_id AND pl.ativo = TRUE
                  JOIN disciplina d ON d.id = %s
                 WHERE c.codigo = :curso AND t.excluida_em IS NULL AND d.sigla = :sigla
                 ORDER BY t.id
                """.formatted(coluna))
                .param("curso", cursoCodigo).param("sigla", sigla).query(Long.class).list();
        return ids.stream().map(this::buscar).flatMap(Optional::stream).toList();
    }

    @Override
    public Turma salvar(Turma t) {
        Long cursoId = jdbc.sql("SELECT id FROM curso WHERE codigo = :c").param("c", t.cursoCodigo()).query(Long.class).single();
        Long centroId = jdbc.sql("SELECT centro_id FROM curso WHERE id = :c").param("c", cursoId).query(Long.class).single();
        Long d23 = t.disciplina2023() == null ? null : idDaDisciplina(cursoId, t.cursoCodigo(), t.disciplina2023());
        Long d08 = t.disciplina2008() == null ? null : idDaDisciplina(cursoId, t.cursoCodigo(), t.disciplina2008());
        Long docente = t.professor() == null ? null : idDoDocente(t.professor());
        Long sala = t.sala() == null ? null : idDaSala(cursoId, centroId, t.sala());
        LocalDateTime agora = LocalDateTime.now(ZoneOffset.UTC);
        long id;
        if (t.id() == null) {
            Long periodo = jdbc.sql("SELECT id FROM periodo_letivo WHERE ativo = TRUE ORDER BY id DESC LIMIT 1")
                    .query(Long.class).single();
            KeyHolder chave = new GeneratedKeyHolder();
            jdbc.sql("""
                    INSERT INTO turma (curso_id, periodo_letivo_id, disciplina_2023_id, disciplina_2008_id, docente_id, sala_id,
                                       vagas, secao, ementa_url, aviso, origem, versao, criado_em, atualizado_em)
                    VALUES (:curso, :periodo, :d23, :d08, :docente, :sala, :vagas, :secao, :url, :aviso, :origem, 0, :agora, :agora)
                    """)
                    .param("curso", cursoId).param("periodo", periodo).param("d23", d23).param("d08", d08)
                    .param("docente", docente).param("sala", sala).param("vagas", t.vagas()).param("secao", t.secao().codigo())
                    .param("url", t.ementaUrl()).param("aviso", t.aviso()).param("origem", t.origem().codigo()).param("agora", agora)
                    .update(chave);
            id = chave.getKey().longValue();
        } else {
            id = t.id();
            int linhas = jdbc.sql("""
                    UPDATE turma SET disciplina_2023_id = :d23, disciplina_2008_id = :d08, docente_id = :docente, sala_id = :sala,
                                     vagas = :vagas, secao = :secao, ementa_url = :url, versao = versao + 1, atualizado_em = :agora
                     WHERE id = :id AND versao = :versao AND excluida_em IS NULL
                    """)
                    .param("d23", d23).param("d08", d08).param("docente", docente).param("sala", sala)
                    .param("vagas", t.vagas()).param("secao", t.secao().codigo()).param("url", t.ementaUrl())
                    .param("agora", agora).param("id", id).param("versao", t.versao()).update();
            if (linhas == 0) {
                throw ErroDeNegocio.conflito("turma_alterada_por_outro",
                        "A turma foi alterada por outra pessoa. Recarregue e tente de novo.", List.of());
            }
            jdbc.sql("DELETE FROM turma_horario WHERE turma_id = :id").param("id", id).update();
        }
        for (HorarioDeAula h : t.horarios()) {
            jdbc.sql("INSERT INTO turma_horario (turma_id, dia_semana, hora_inicio, hora_fim) VALUES (:t, :d, :i, :f)")
                    .param("t", id).param("d", h.diaSemana()).param("i", h.inicio()).param("f", h.fim()).update();
        }
        return buscar(id).orElseThrow();
    }

    @Override
    public void marcarComoExcluida(long id, Instant quando) {
        LocalDateTime q = LocalDateTime.ofInstant(quando, ZoneOffset.UTC);
        jdbc.sql("UPDATE turma SET excluida_em = :q, atualizado_em = :q, versao = versao + 1 WHERE id = :id AND excluida_em IS NULL")
                .param("q", q).param("id", id).update();
    }

    @Override
    public Optional<Ementa> buscarEmenta(String codigoDaDisciplina) {
        return jdbc.sql("SELECT codigo, nome, texto, fonte FROM ementa WHERE codigo = :c")
                .param("c", codigoDaDisciplina)
                .query((rs, n) -> new Ementa(rs.getString("codigo"), rs.getString("nome"), rs.getString("texto"), rs.getString("fonte")))
                .optional();
    }

    // ---------- apoio ----------

    private List<HorarioDeAula> horariosDa(long turmaId) {
        return jdbc.sql("SELECT dia_semana, hora_inicio, hora_fim FROM turma_horario WHERE turma_id = :t ORDER BY dia_semana, hora_inicio")
                .param("t", turmaId).query((rs, n) -> lerHorario(rs)).list();
    }

    private static HorarioDeAula lerHorario(ResultSet rs) throws SQLException {
        return new HorarioDeAula(rs.getInt("dia_semana"), rs.getObject("hora_inicio", LocalTime.class), rs.getObject("hora_fim", LocalTime.class));
    }

    private record LinhaDeTurma(long id, String cursoCodigo, int versao, int vagas, String secao, String ementaUrl, String aviso, String origem,
                                DisciplinaDaMatriz d2023, DisciplinaDaMatriz d2008, String docente, String sala) {
        Turma paraTurma(List<HorarioDeAula> horarios) {
            return new Turma(id, cursoCodigo, d2023, d2008, docente, sala, vagas, Secao.deCodigo(secao), ementaUrl, aviso,
                    Origem.deCodigo(origem), versao, horarios);
        }
    }

    private LinhaDeTurma lerLinha(ResultSet rs, int n) throws SQLException {
        return new LinhaDeTurma(rs.getLong("id"), rs.getString("curso_codigo"), rs.getInt("versao"), rs.getInt("vagas"),
                rs.getString("secao"), rs.getString("ementa_url"), rs.getString("aviso"), rs.getString("origem"),
                lerDisciplina(rs, "m23", "s23", "c23", "n23", "p23", "g23"),
                lerDisciplina(rs, "m08", "s08", "c08", "n08", "p08", "g08"),
                rs.getString("docente"), rs.getString("sala"));
    }

    private static DisciplinaDaMatriz lerDisciplina(ResultSet rs, String m, String s, String c, String nome, String p, String g) throws SQLException {
        if (rs.getObject(m) == null) return null;
        return new DisciplinaDaMatriz(rs.getInt(m), rs.getString(s), rs.getString(c), rs.getString(nome), rs.getString(p), rs.getBoolean(g));
    }

    /** Mesma chave natural usada pela ferramenta de importação legada (banco-de-dados/ferramentas/lib/legado.mjs). */
    static String chaveNatural(String cursoCodigo, DisciplinaDaMatriz d) {
        String base = String.join("|", cursoCodigo, String.valueOf(d.matriz()), Textos.limpar(d.sigla()),
                d.codigo() == null ? "" : Textos.limpar(d.codigo()), Textos.limpar(d.nome()), Textos.limpar(d.periodo()));
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(base.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private Long idDaDisciplina(Long cursoId, String cursoCodigo, DisciplinaDaMatriz d) {
        String chave = chaveNatural(cursoCodigo, d);
        jdbc.sql("""
                INSERT IGNORE INTO disciplina (curso_id, matriz, sigla, codigo, nome, periodo_curricular, pos_graduacao, chave_natural)
                VALUES (:curso, :matriz, :sigla, :codigo, :nome, :periodo, :pos, :chave)
                """)
                .param("curso", cursoId).param("matriz", d.matriz()).param("sigla", d.sigla()).param("codigo", d.codigo())
                .param("nome", d.nome()).param("periodo", d.periodo()).param("pos", d.posGraduacao()).param("chave", chave).update();
        return jdbc.sql("SELECT id FROM disciplina WHERE chave_natural = :c").param("c", chave).query(Long.class).single();
    }

    private Long idDoDocente(String nome) {
        String chave = Textos.chaveDeDocente(nome);
        jdbc.sql("INSERT IGNORE INTO docente (nome, nome_normalizado) VALUES (:nome, :chave)")
                .param("nome", nome).param("chave", chave).update();
        return jdbc.sql("SELECT id FROM docente WHERE nome_normalizado = :c").param("c", chave).query(Long.class).single();
    }

    private Long idDaSala(Long cursoId, Long centroId, String nome) {
        jdbc.sql("INSERT IGNORE INTO sala (centro_id, nome) VALUES (:centro, :nome)").param("centro", centroId).param("nome", nome).update();
        Long salaId = jdbc.sql("SELECT id FROM sala WHERE centro_id = :centro AND nome = :nome")
                .param("centro", centroId).param("nome", nome).query(Long.class).single();
        Long noCatalogo = jdbc.sql("SELECT COUNT(*) FROM curso_sala WHERE curso_id = :curso AND sala_id = :sala")
                .param("curso", cursoId).param("sala", salaId).query(Long.class).single();
        if (noCatalogo == 0) {
            Long maior = jdbc.sql("SELECT COALESCE(MAX(ordem), 0) FROM curso_sala WHERE curso_id = :curso")
                    .param("curso", cursoId).query(Long.class).single();
            jdbc.sql("INSERT INTO curso_sala (curso_id, sala_id, ordem) VALUES (:curso, :sala, :ordem)")
                    .param("curso", cursoId).param("sala", salaId).param("ordem", maior + 1).update();
        }
        return salaId;
    }
}
