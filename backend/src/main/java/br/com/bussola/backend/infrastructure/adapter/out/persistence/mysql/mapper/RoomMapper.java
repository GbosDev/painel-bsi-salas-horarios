package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.mapper;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.room.Room;
import br.com.bussola.backend.domain.room.RoomId;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.RoomJpaEntity;

public final class RoomMapper {

    private RoomMapper() {}

    public static Room toDomain(RoomJpaEntity e) {
        return new Room(RoomId.of(e.getId()), CourseId.of(e.getCourseId()), e.getNome());
    }

    public static RoomJpaEntity toEntity(Room r) {
        return new RoomJpaEntity(r.id().value(), r.courseId().value(), r.nome());
    }
}
