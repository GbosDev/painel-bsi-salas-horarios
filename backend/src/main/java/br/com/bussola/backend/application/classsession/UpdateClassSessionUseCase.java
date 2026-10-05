package br.com.bussola.backend.application.classsession;

import br.com.bussola.backend.domain.audit.AuditLogEntry;
import br.com.bussola.backend.domain.audit.AuditLogRepository;
import br.com.bussola.backend.domain.classsession.ClassSession;
import br.com.bussola.backend.domain.classsession.ClassSessionId;
import br.com.bussola.backend.domain.classsession.ClassSessionRepository;
import br.com.bussola.backend.domain.classsession.WeeklySlot;
import br.com.bussola.backend.domain.shared.NotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Professor-only inline edit (professor / sala / horários), replacing the
 * legacy BussolaStore.saveOverride localStorage layer with a real, shared,
 * audited mutation.
 */
@Service
public class UpdateClassSessionUseCase {

    private final ClassSessionRepository classSessionRepository;
    private final AuditLogRepository auditLogRepository;

    public UpdateClassSessionUseCase(ClassSessionRepository classSessionRepository,
                                       AuditLogRepository auditLogRepository) {
        this.classSessionRepository = classSessionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public ClassSession execute(Long id, String professor, String sala, List<WeeklySlot> sessions,
                                  String actorUsername) {
        ClassSessionId classSessionId = ClassSessionId.of(id);
        ClassSession existing = classSessionRepository.findById(classSessionId)
                .orElseThrow(() -> new NotFoundException("Turma", id));

        String before = describe(existing);
        existing.applyEdit(professor, sala, sessions);
        ClassSession saved = classSessionRepository.save(existing);

        auditLogRepository.append(AuditLogEntry.of(saved.courseId(), saved.id(), actorUsername,
                "UPDATE", before, describe(saved)));
        return saved;
    }

    private String describe(ClassSession c) {
        return "professor=" + c.professor() + ";sala=" + c.sala() + ";horarios=" + c.sessions().size();
    }
}
