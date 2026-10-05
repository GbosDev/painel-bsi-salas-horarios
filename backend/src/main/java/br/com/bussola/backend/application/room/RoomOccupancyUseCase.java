package br.com.bussola.backend.application.room;

import br.com.bussola.backend.domain.classsession.ClassSession;
import br.com.bussola.backend.domain.classsession.ClassSessionRepository;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.room.Room;
import br.com.bussola.backend.domain.room.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/** Replaces the client-side roomOccupancyAt()/busy() helpers with a server-computed query. */
@Service
public class RoomOccupancyUseCase {

    private final RoomRepository roomRepository;
    private final ClassSessionRepository classSessionRepository;

    public RoomOccupancyUseCase(RoomRepository roomRepository, ClassSessionRepository classSessionRepository) {
        this.roomRepository = roomRepository;
        this.classSessionRepository = classSessionRepository;
    }

    public record RoomStatus(String sala, boolean ocupada, ClassSession ocupante) {}

    public List<RoomStatus> execute(String courseId, int dayNum, int hour) {
        CourseId id = CourseId.of(courseId);
        List<Room> rooms = roomRepository.findByCourseId(id);
        List<ClassSession> classSessions = classSessionRepository.findByCourseId(id);

        return rooms.stream().map(room -> {
            Optional<ClassSession> occupant = classSessions.stream()
                    .filter(cs -> cs.occupiesRoomAt(room.nome(), dayNum, hour))
                    .findFirst();
            return new RoomStatus(room.nome(), occupant.isPresent(), occupant.orElse(null));
        }).toList();
    }
}
