package br.com.bussola.backend.domain.room;

import br.com.bussola.backend.domain.course.CourseId;

import java.util.List;
import java.util.Optional;

public interface RoomRepository {
    List<Room> findByCourseId(CourseId courseId);
    Optional<Room> findByCourseIdAndNome(CourseId courseId, String nome);
    Room save(Room room);
    void deleteById(RoomId id);
}
