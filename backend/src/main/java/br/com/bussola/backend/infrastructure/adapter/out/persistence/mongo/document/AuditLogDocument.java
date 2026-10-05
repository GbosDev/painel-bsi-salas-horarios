package br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** Append-only, event-shaped log of every professor edit to a turma. */
@Document(collection = "audit_log")
public class AuditLogDocument {

    @Id
    private String id;
    private String courseId;
    private Long classSessionId;
    private String actorUsername;
    private String action;
    private String beforeSnapshot;
    private String afterSnapshot;
    private Instant occurredAt;

    protected AuditLogDocument() {}

    public AuditLogDocument(String id, String courseId, Long classSessionId, String actorUsername,
                              String action, String beforeSnapshot, String afterSnapshot, Instant occurredAt) {
        this.id = id;
        this.courseId = courseId;
        this.classSessionId = classSessionId;
        this.actorUsername = actorUsername;
        this.action = action;
        this.beforeSnapshot = beforeSnapshot;
        this.afterSnapshot = afterSnapshot;
        this.occurredAt = occurredAt;
    }

    public String getId() { return id; }
    public String getCourseId() { return courseId; }
    public Long getClassSessionId() { return classSessionId; }
    public String getActorUsername() { return actorUsername; }
    public String getAction() { return action; }
    public String getBeforeSnapshot() { return beforeSnapshot; }
    public String getAfterSnapshot() { return afterSnapshot; }
    public Instant getOccurredAt() { return occurredAt; }
}
