package br.unirio.painel.importacao.infra;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoteJpaRepository extends JpaRepository<LoteJpa, Long> {

    @Query("select l from LoteJpa l where l.hashSha256 = :hash and l.cursoId = :cursoId and l.situacao = 'APLICADO' order by l.aplicadoEm desc limit 1")
    Optional<LoteJpa> ultimoAplicado(@Param("hash") String hash, @Param("cursoId") Long cursoId);
}
