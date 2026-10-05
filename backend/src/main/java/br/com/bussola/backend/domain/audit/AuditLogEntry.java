package br.com.bussola.backend.domain.audit;

import br.com.bussola.backend.domain.classsession.ClassSessionId;
import br.com.bussola.backend.domain.course.CourseId;

import java.time.Instant;

/**
 * An immutable, append-only record of a professor's edit to a turma.
 * Event-shaped and schema-flexible by nature (the "before"/"after" diff
 * varies per action) — appended constantly, never updated, never joined:
 * a canonical use case for MongoDB over the relational core.
 */
public record AuditLogEntry(
        String id,
        CourseId courseId,
        ClassSessionId classSessionId,
        String actorUsername,
        String action,
        String beforeSnapshot,
        String afterSnapshot,
        Instant occurredAt
) {
    public static AuditLogEntry of(CourseId courseId, ClassSessionId classSessionId,
                                     String actorUsername, String action,
                                     String before, String after) {
        return new AuditLogEntry(null, courseId, classSessionId, actorUsername, action,
                before, after, Instant.now());
    }
}
