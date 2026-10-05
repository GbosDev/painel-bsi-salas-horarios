package br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.adapter;

import br.com.bussola.backend.domain.audit.AuditLogEntry;
import br.com.bussola.backend.domain.audit.AuditLogRepository;
import br.com.bussola.backend.domain.classsession.ClassSessionId;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.document.AuditLogDocument;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.repository.AuditLogMongoRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class AuditLogRepositoryAdapter implements AuditLogRepository {

    private final AuditLogMongoRepository mongoRepository;

    public AuditLogRepositoryAdapter(AuditLogMongoRepository mongoRepository) {
        this.mongoRepository = mongoRepository;
    }

    @Override
    public AuditLogEntry append(AuditLogEntry entry) {
        var saved = mongoRepository.save(new AuditLogDocument(
                UUID.randomUUID().toString(),
                entry.courseId().value(),
                entry.classSessionId().value(),
                entry.actorUsername(),
                entry.action(),
                entry.beforeSnapshot(),
                entry.afterSnapshot(),
                entry.occurredAt()
        ));
        return toDomain(saved);
    }

    @Override
    public List<AuditLogEntry> findByClassSessionId(ClassSessionId classSessionId) {
        return mongoRepository.findByClassSessionId(classSessionId.value()).stream()
                .map(this::toDomain).toList();
    }

    private AuditLogEntry toDomain(AuditLogDocument d) {
        return new AuditLogEntry(d.getId(), CourseId.of(d.getCourseId()), ClassSessionId.of(d.getClassSessionId()),
                d.getActorUsername(), d.getAction(), d.getBeforeSnapshot(), d.getAfterSnapshot(), d.getOccurredAt());
    }
}
