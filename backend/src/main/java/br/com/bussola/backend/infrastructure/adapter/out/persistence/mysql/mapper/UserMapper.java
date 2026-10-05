package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.mapper;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.user.Role;
import br.com.bussola.backend.domain.user.User;
import br.com.bussola.backend.domain.user.UserId;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.UserJpaEntity;

public final class UserMapper {

    private UserMapper() {}

    public static User toDomain(UserJpaEntity e) {
        return new User(
                UserId.of(e.getId()),
                e.getUsername(),
                e.getPasswordHash(),
                e.getNome(),
                Role.valueOf(e.getRole().name()),
                e.getMatricula(),
                e.getCourseId() == null ? null : CourseId.of(e.getCourseId())
        );
    }

    public static UserJpaEntity toEntity(User u) {
        return new UserJpaEntity(
                u.id().value(),
                u.username(),
                u.passwordHash(),
                u.nome(),
                UserJpaEntity.RoleJpa.valueOf(u.role().name()),
                u.matricula(),
                u.courseId() == null ? null : u.courseId().value()
        );
    }
}
