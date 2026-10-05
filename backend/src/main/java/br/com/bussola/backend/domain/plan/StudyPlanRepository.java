package br.com.bussola.backend.domain.plan;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.user.UserId;

import java.util.Optional;

public interface StudyPlanRepository {
    Optional<StudyPlan> findByUserIdAndCourseId(UserId userId, CourseId courseId);
    StudyPlan save(StudyPlan plan);
}
