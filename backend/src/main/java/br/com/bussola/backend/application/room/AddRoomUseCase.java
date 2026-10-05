package br.com.bussola.backend.application.room;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.room.Room;
import br.com.bussola.backend.domain.room.RoomRepository;
import br.com.bussola.backend.domain.shared.BusinessRuleViolationException;
import org.springframework.stereotype.Service;

@Service
public class AddRoomUseCase {

    private final RoomRepository roomRepository;

    public AddRoomUseCase(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room execute(String courseId, String nome) {
        CourseId id = CourseId.of(courseId);
        if (roomRepository.findByCourseIdAndNome(id, nome).isPresent()) {
            throw new BusinessRuleViolationException("Sala já cadastrada: " + nome);
        }
        return roomRepository.save(Room.create(id, nome));
    }
}
