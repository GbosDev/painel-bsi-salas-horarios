package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.mapper;

import br.com.bussola.backend.domain.course.Course;
import br.com.bussola.backend.domain.course.CourseGroup;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.course.CourseStatus;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.CourseGroupJpaEntity;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.CourseJpaEntity;

public final class CourseMapper {

    private CourseMapper() {}

    public static Course toDomain(CourseJpaEntity e) {
        return new Course(
                CourseId.of(e.getId()),
                e.getGrupoId(),
                e.getSigla(),
                e.getPainel(),
                e.getNome(),
                e.getUnidade(),
                CourseStatus.valueOf(e.getStatus().name()),
                e.getDescricao()
        );
    }

    public static CourseJpaEntity toEntity(Course c) {
        return new CourseJpaEntity(
                c.id().value(),
                c.grupoId(),
                c.sigla(),
                c.painel(),
                c.nome(),
                c.unidade(),
                CourseJpaEntity.StatusJpa.valueOf(c.status().name()),
                c.descricao()
        );
    }

    public static CourseGroup toDomain(CourseGroupJpaEntity e) {
        return new CourseGroup(e.getId(), e.getSigla(), e.getNome(), e.getDescricao());
    }
}
