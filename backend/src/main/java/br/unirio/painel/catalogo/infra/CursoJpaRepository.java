package br.unirio.painel.catalogo.infra;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CursoJpaRepository extends JpaRepository<CursoJpa, Long> {

    Optional<CursoJpa> findByCodigo(String codigo);

    List<CursoJpa> findAllByOrderByOrdemAsc();
}
