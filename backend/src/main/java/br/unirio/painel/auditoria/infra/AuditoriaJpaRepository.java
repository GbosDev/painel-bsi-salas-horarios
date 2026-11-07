package br.unirio.painel.auditoria.infra;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditoriaJpaRepository extends JpaRepository<AuditoriaJpa, Long> {

    /** Parâmetros nunca nulos: '' = sem filtro (evita tipagem de null no Hibernate 6). texto vem em minúsculas. */
    @Query("""
            select a from AuditoriaJpa a
             where (:curso = '' or a.cursoId in (select c.id from CursoJpa c where c.codigo = :curso))
               and (:tipo = '' or a.tipo = :tipo)
               and a.ocorridaEm >= :desde
               and (:texto = '' or lower(coalesce(a.turmaSigla, '')) like concat('%', :texto, '%')
                               or lower(coalesce(a.turmaNome, '')) like concat('%', :texto, '%')
                               or lower(a.autorNome) like concat('%', :texto, '%')
                               or lower(a.motivo) like concat('%', :texto, '%')
                               or a.cursoId in (select c.id from CursoJpa c where lower(c.nome) like concat('%', :texto, '%')))
             order by a.ocorridaEm desc, a.id desc
            """)
    List<AuditoriaJpa> consultar(@Param("curso") String curso, @Param("tipo") String tipo, @Param("desde") Instant desde,
                                 @Param("texto") String texto, Pageable limite);
}
