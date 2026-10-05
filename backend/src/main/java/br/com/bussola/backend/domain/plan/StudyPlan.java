package br.com.bussola.backend.domain.plan;

import br.com.bussola.backend.domain.classsession.ClassSessionId;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.user.UserId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Aggregate root for a student's personal "Meu plano" — a free-form,
 * per-user list of chosen turma ids. Persisted in MongoDB: it is
 * schema-flexible, owned by a single user, and never joined against
 * relationally, so it does not belong in the relational core.
 */
public class StudyPlan {

    private final UserId userId;
    private final CourseId courseId;
    private List<ClassSessionId> chosenClassSessionIds;
    private Instant updatedAt;

    public StudyPlan(UserId userId, CourseId courseId, List<ClassSessionId> chosenClassSessionIds,
                      Instant updatedAt) {
        this.userId = Objects.requireNonNull(userId);
        this.courseId = Objects.requireNonNull(courseId);
        this.chosenClassSessionIds = chosenClassSessionIds == null
                ? new ArrayList<>() : new ArrayList<>(chosenClassSessionIds);
        this.updatedAt = updatedAt == null ? Instant.now() : updatedAt;
    }

    public static StudyPlan empty(UserId userId, CourseId courseId) {
        return new StudyPlan(userId, courseId, List.of(), Instant.now());
    }

    public void replace(List<ClassSessionId> newSelection) {
        this.chosenClassSessionIds = new ArrayList<>(newSelection == null ? List.of() : newSelection);
        this.updatedAt = Instant.now();
    }

    public UserId userId() { return userId; }
    public CourseId courseId() { return courseId; }
    public List<ClassSessionId> chosenClassSessionIds() { return List.copyOf(chosenClassSessionIds); }
    public Instant updatedAt() { return updatedAt; }
}
