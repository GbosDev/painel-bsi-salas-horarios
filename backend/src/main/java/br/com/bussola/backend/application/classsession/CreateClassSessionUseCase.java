package br.com.bussola.backend.application.classsession;

import br.com.bussola.backend.domain.audit.AuditLogEntry;
import br.com.bussola.backend.domain.audit.AuditLogRepository;
import br.com.bussola.backend.domain.classsession.ClassSession;
import br.com.bussola.backend.domain.classsession.ClassSessionRepository;
import br.com.bussola.backend.domain.course.CourseId;
import org.springframework.stereotype.Service;

/** Professor-only action: replaces BussolaStore.addRecord's client-side-only mutation. */
@Service
public class CreateClassSessionUseCase {

    private final ClassSessionRepository classSessionRepository;
    private final AuditLogRepository auditLogRepository;

    public CreateClassSessionUseCase(ClassSessionRepository classSessionRepository,
                                       AuditLogRepository auditLogRepository) {
        this.classSessionRepository = classSessionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public ClassSession execute(ClassSessionCommand command, String actorUsername) {
        ClassSession created = ClassSession.create(
                CourseId.of(command.courseId()),
                command.curr2008(),
                command.curr2023(),
                command.professor(),
                command.sessions(),
                command.sala(),
                command.vagas(),
                command.section(),
                command.programa(),
                command.ementaUrl()
        );
        ClassSession saved = classSessionRepository.save(created);
        auditLogRepository.append(AuditLogEntry.of(saved.courseId(), saved.id(), actorUsername,
                "CREATE", null, describe(saved)));
        return saved;
    }

    private String describe(ClassSession c) {
        return "sigla=" + (c.curr2023() != null ? c.curr2023().sigla() : c.curr2008().sigla())
                + ";professor=" + c.professor() + ";sala=" + c.sala();
    }
}
