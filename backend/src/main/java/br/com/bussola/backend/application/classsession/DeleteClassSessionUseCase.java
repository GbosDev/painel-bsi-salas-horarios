package br.com.bussola.backend.application.classsession;

import br.com.bussola.backend.domain.audit.AuditLogEntry;
import br.com.bussola.backend.domain.audit.AuditLogRepository;
import br.com.bussola.backend.domain.classsession.ClassSession;
import br.com.bussola.backend.domain.classsession.ClassSessionId;
import br.com.bussola.backend.domain.classsession.ClassSessionRepository;
import br.com.bussola.backend.domain.shared.NotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DeleteClassSessionUseCase {

    private final ClassSessionRepository classSessionRepository;
    private final AuditLogRepository auditLogRepository;

    public DeleteClassSessionUseCase(ClassSessionRepository classSessionRepository,
                                       AuditLogRepository auditLogRepository) {
        this.classSessionRepository = classSessionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public void execute(Long id, String actorUsername) {
        ClassSessionId classSessionId = ClassSessionId.of(id);
        ClassSession existing = classSessionRepository.findById(classSessionId)
                .orElseThrow(() -> new NotFoundException("Turma", id));
        classSessionRepository.deleteById(classSessionId);
        auditLogRepository.append(AuditLogEntry.of(existing.courseId(), classSessionId, actorUsername,
                "DELETE", existing.professor() + "/" + existing.sala(), null));
    }
}
