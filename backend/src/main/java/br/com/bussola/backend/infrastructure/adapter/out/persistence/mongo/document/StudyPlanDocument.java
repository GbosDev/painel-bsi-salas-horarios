package br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/** The student's personal "Meu plano" — free-form, per-user, never joined relationally. */
@Document(collection = "study_plan")
@CompoundIndex(def = "{'userId': 1, 'courseId': 1}", unique = true)
public class StudyPlanDocument {

    @Id
    private String id;
    private String userId;
    private String courseId;
    private List<Long> chosenClassSessionIds;
    private Instant updatedAt;

    protected StudyPlanDocument() {}

    public StudyPlanDocument(String id, String userId, String courseId,
                               List<Long> chosenClassSessionIds, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.courseId = courseId;
        this.chosenClassSessionIds = chosenClassSessionIds;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getCourseId() { return courseId; }
    public List<Long> getChosenClassSessionIds() { return chosenClassSessionIds; }
    public Instant getUpdatedAt() { return updatedAt; }
}
