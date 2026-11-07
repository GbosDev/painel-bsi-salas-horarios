package br.unirio.painel.plano.infra;

import br.unirio.painel.compartilhado.ReferenciasDeCurso;
import br.unirio.painel.plano.aplicacao.RepositorioDePlanos;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class RepositorioDePlanosJpa implements RepositorioDePlanos {

    private final PlanoAlunoJpaRepository planos;
    private final ReferenciasDeCurso cursos;
    private final JdbcClient jdbc;

    public RepositorioDePlanosJpa(PlanoAlunoJpaRepository planos, ReferenciasDeCurso cursos, JdbcClient jdbc) {
        this.planos = planos;
        this.cursos = cursos;
        this.jdbc = jdbc;
    }

    private Long periodoVigenteId() {
        return jdbc.sql("SELECT id FROM periodo_letivo WHERE ativo = TRUE ORDER BY id DESC LIMIT 1").query(Long.class).single();
    }

    @Override
    public Optional<PlanoSalvo> buscar(long usuarioId, String cursoCodigo) {
        return cursos.idPorCodigo(cursoCodigo).flatMap(cursoId ->
                planos.findByUsuarioIdAndCursoIdAndPeriodoLetivoId(usuarioId, cursoId, periodoVigenteId()))
                .map(p -> new PlanoSalvo(List.copyOf(p.getTurmaIds()), p.getAtualizadoEm()));
    }

    @Override
    public void substituir(long usuarioId, String cursoCodigo, List<Long> turmaIds, Instant quando) {
        Long cursoId = cursos.idPorCodigo(cursoCodigo).orElseThrow();
        Long periodo = periodoVigenteId();
        PlanoAlunoJpa plano = planos.findByUsuarioIdAndCursoIdAndPeriodoLetivoId(usuarioId, cursoId, periodo)
                .orElseGet(() -> new PlanoAlunoJpa(usuarioId, cursoId, periodo));
        plano.getTurmaIds().clear();
        plano.getTurmaIds().addAll(turmaIds);
        plano.setAtualizadoEm(quando);
        planos.save(plano);
    }
}
