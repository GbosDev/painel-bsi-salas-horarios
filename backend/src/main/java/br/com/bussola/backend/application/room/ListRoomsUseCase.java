package br.com.bussola.backend.application.room;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.room.Room;
import br.com.bussola.backend.domain.room.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ListRoomsUseCase {

    private final RoomRepository roomRepository;

    public ListRoomsUseCase(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public List<Room> execute(String courseId) {
        return roomRepository.findByCourseId(CourseId.of(courseId));
    }
}
