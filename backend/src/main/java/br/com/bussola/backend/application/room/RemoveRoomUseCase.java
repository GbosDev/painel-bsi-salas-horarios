package br.com.bussola.backend.application.room;

import br.com.bussola.backend.domain.classsession.ClassSessionRepository;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.room.Room;
import br.com.bussola.backend.domain.room.RoomRepository;
import br.com.bussola.backend.domain.shared.BusinessRuleViolationException;
import br.com.bussola.backend.domain.shared.NotFoundException;
import org.springframework.stereotype.Service;

/** Mirrors the legacy admin.js "inUse" guard: a room in use by any turma cannot be removed. */
@Service
public class RemoveRoomUseCase {

    private final RoomRepository roomRepository;
    private final ClassSessionRepository classSessionRepository;

    public RemoveRoomUseCase(RoomRepository roomRepository, ClassSessionRepository classSessionRepository) {
        this.roomRepository = roomRepository;
        this.classSessionRepository = classSessionRepository;
    }

    public void execute(String courseId, String nome) {
        CourseId id = CourseId.of(courseId);
        Room room = roomRepository.findByCourseIdAndNome(id, nome)
                .orElseThrow(() -> new NotFoundException("Sala", nome));

        long emUso = classSessionRepository.findByCourseId(id).stream()
                .filter(cs -> nome.equalsIgnoreCase(cs.sala()))
                .count();
        if (emUso > 0) {
            throw new BusinessRuleViolationException(
                    "Sala em uso por " + emUso + " turma(s) e não pode ser removida");
        }
        roomRepository.deleteById(room.id());
    }
}
