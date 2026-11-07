package br.unirio.painel.importacao.infra;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LinhaJpaRepository extends JpaRepository<LinhaJpa, Long> {

    List<LinhaJpa> findByLoteIdOrderByNumeroLinhaAsc(Long loteId);
}
