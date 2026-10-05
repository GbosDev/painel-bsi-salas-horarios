package br.com.bussola.backend.application.plan;

import br.com.bussola.backend.domain.classsession.ClassSession;
import br.com.bussola.backend.domain.classsession.ClassSessionId;
import br.com.bussola.backend.domain.classsession.ClassSessionRepository;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.plan.StudyPlan;
import br.com.bussola.backend.domain.plan.StudyPlanRepository;
import br.com.bussola.backend.domain.shared.BusinessRuleViolationException;
import br.com.bussola.backend.domain.user.UserId;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/** Server-side persistence for "Meu plano", replacing the per-browser localStorage plan. */
@Service
public class SaveStudyPlanUseCase {

    private final StudyPlanRepository studyPlanRepository;
    private final ClassSessionRepository classSessionRepository;

    public SaveStudyPlanUseCase(StudyPlanRepository studyPlanRepository,
                                  ClassSessionRepository classSessionRepository) {
        this.studyPlanRepository = studyPlanRepository;
        this.classSessionRepository = classSessionRepository;
    }

    public record ConflictInfo(Long a, Long b) {}

    public record Result(StudyPlan plan, List<ConflictInfo> conflicts) {}

    public Result execute(String username, String courseId, List<Long> classSessionIds) {
        CourseId cid = CourseId.of(courseId);
        List<ClassSession> chosen = new ArrayList<>();
        for (Long rawId : classSessionIds) {
            ClassSessionId csId = ClassSessionId.of(rawId);
            ClassSession cs = classSessionRepository.findById(csId)
                    .orElseThrow(() -> new BusinessRuleViolationException("Turma inexistente: " + rawId));
            chosen.add(cs);
        }

        List<ConflictInfo> conflicts = new ArrayList<>();
        for (int i = 0; i < chosen.size(); i++) {
            for (int j = i + 1; j < chosen.size(); j++) {
                if (chosen.get(i).clashesWith(chosen.get(j))) {
                    conflicts.add(new ConflictInfo(chosen.get(i).id().value(), chosen.get(j).id().value()));
                }
            }
        }

        UserId userId = UserId.of(username);
        StudyPlan plan = studyPlanRepository.findByUserIdAndCourseId(userId, cid)
                .orElseGet(() -> StudyPlan.empty(userId, cid));
        plan.replace(classSessionIds.stream().map(ClassSessionId::of).toList());
        StudyPlan saved = studyPlanRepository.save(plan);

        return new Result(saved, conflicts);
    }
}
