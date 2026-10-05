package br.com.bussola.backend.application.plan;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.plan.StudyPlan;
import br.com.bussola.backend.domain.plan.StudyPlanRepository;
import br.com.bussola.backend.domain.user.UserId;
import org.springframework.stereotype.Service;

@Service
public class GetStudyPlanUseCase {

    private final StudyPlanRepository studyPlanRepository;

    public GetStudyPlanUseCase(StudyPlanRepository studyPlanRepository) {
        this.studyPlanRepository = studyPlanRepository;
    }

    public StudyPlan execute(String username, String courseId) {
        UserId userId = UserId.of(username);
        CourseId cid = CourseId.of(courseId);
        return studyPlanRepository.findByUserIdAndCourseId(userId, cid)
                .orElseGet(() -> StudyPlan.empty(userId, cid));
    }
}
