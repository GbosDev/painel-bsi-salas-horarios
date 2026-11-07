package br.unirio.painel.plano.infra;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanoAlunoJpaRepository extends JpaRepository<PlanoAlunoJpa, Long> {

    Optional<PlanoAlunoJpa> findByUsuarioIdAndCursoIdAndPeriodoLetivoId(Long usuarioId, Long cursoId, Long periodoLetivoId);
}
