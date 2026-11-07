package br.unirio.painel.catalogo.infra;

import br.unirio.painel.catalogo.aplicacao.RepositorioDeCatalogo;
import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.catalogo.dominio.SalaDoCatalogo;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Cursos/centros via Spring Data JPA; catálogo de salas via SQL explícito (junção curso_sala). */
@Repository
public class RepositorioDeCatalogoJpa implements RepositorioDeCatalogo {

    private final CursoJpaRepository cursos;
    private final JdbcClient jdbc;

    public RepositorioDeCatalogoJpa(CursoJpaRepository cursos, JdbcClient jdbc) {
        this.cursos = cursos;
        this.jdbc = jdbc;
    }

    static Curso paraDominio(CursoJpa c) {
        return new Curso(c.getCodigo(), c.getSigla(), c.getNome(), c.getCentro().getSigla(), c.getCentro().getNome(),
                c.getCentro().getDescricao(), c.getSituacao(), c.getDescricao(), c.getTema(), c.isAlternaMatrizes(),
                c.getDuracaoAulaHoras());
    }

    @Override
    public List<Curso> cursos() {
        return cursos.findAllByOrderByOrdemAsc().stream().map(RepositorioDeCatalogoJpa::paraDominio).toList();
    }

    @Override
    public Optional<Curso> curso(String codigo) {
        return cursos.findByCodigo(codigo).map(RepositorioDeCatalogoJpa::paraDominio);
    }

    @Override
    public List<SalaDoCatalogo> salasDoCurso(String cursoCodigo) {
        return jdbc.sql("""
                SELECT s.id, s.nome,
                       (SELECT COUNT(*) FROM turma t
                         WHERE t.sala_id = s.id AND t.curso_id = cs.curso_id AND t.excluida_em IS NULL) AS em_uso
                  FROM curso_sala cs
                  JOIN sala s ON s.id = cs.sala_id
                  JOIN curso c ON c.id = cs.curso_id
                 WHERE c.codigo = :curso
                 ORDER BY cs.ordem, s.nome
                """)
                .param("curso", cursoCodigo)
                .query((rs, n) -> new SalaDoCatalogo(rs.getLong("id"), rs.getString("nome"), rs.getLong("em_uso")))
                .list();
    }

    @Override
    public boolean salaExisteNoCurso(String cursoCodigo, String nomeDaSala) {
        return jdbc.sql("""
                SELECT COUNT(*) FROM curso_sala cs
                  JOIN sala s ON s.id = cs.sala_id
                  JOIN curso c ON c.id = cs.curso_id
                 WHERE c.codigo = :curso AND s.nome = :nome
                """)
                .param("curso", cursoCodigo).param("nome", nomeDaSala)
                .query(Long.class).single() > 0;
    }

    @Override
    public boolean adicionarSala(String cursoCodigo, String nomeDaSala) {
        CursoJpa curso = cursos.findByCodigo(cursoCodigo).orElseThrow();
        jdbc.sql("INSERT IGNORE INTO sala (centro_id, nome) VALUES (:centro, :nome)")
                .param("centro", curso.getCentro().getId()).param("nome", nomeDaSala).update();
        Long salaId = jdbc.sql("SELECT id FROM sala WHERE centro_id = :centro AND nome = :nome")
                .param("centro", curso.getCentro().getId()).param("nome", nomeDaSala).query(Long.class).single();
        Long ja = jdbc.sql("SELECT COUNT(*) FROM curso_sala WHERE curso_id = :curso AND sala_id = :sala")
                .param("curso", curso.getId()).param("sala", salaId).query(Long.class).single();
        if (ja > 0) return false;
        Long maior = jdbc.sql("SELECT COALESCE(MAX(ordem), 0) FROM curso_sala WHERE curso_id = :curso")
                .param("curso", curso.getId()).query(Long.class).single();
        jdbc.sql("INSERT INTO curso_sala (curso_id, sala_id, ordem) VALUES (:curso, :sala, :ordem)")
                .param("curso", curso.getId()).param("sala", salaId).param("ordem", maior + 1).update();
        return true;
    }

    @Override
    public Optional<SalaDoCatalogo> salaDoCurso(String cursoCodigo, long salaId) {
        return salasDoCurso(cursoCodigo).stream().filter(s -> s.id() == salaId).findFirst();
    }

    @Override
    public void removerSalaDoCurso(String cursoCodigo, long salaId) {
        jdbc.sql("""
                DELETE cs FROM curso_sala cs JOIN curso c ON c.id = cs.curso_id
                 WHERE c.codigo = :curso AND cs.sala_id = :sala
                """)
                .param("curso", cursoCodigo).param("sala", salaId).update();
    }
}
