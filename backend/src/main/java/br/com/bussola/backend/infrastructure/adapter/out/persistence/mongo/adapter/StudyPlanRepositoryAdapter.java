package br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.adapter;

import br.com.bussola.backend.domain.classsession.ClassSessionId;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.plan.StudyPlan;
import br.com.bussola.backend.domain.plan.StudyPlanRepository;
import br.com.bussola.backend.domain.user.UserId;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.document.StudyPlanDocument;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.repository.StudyPlanMongoRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class StudyPlanRepositoryAdapter implements StudyPlanRepository {

    private final StudyPlanMongoRepository mongoRepository;

    public StudyPlanRepositoryAdapter(StudyPlanMongoRepository mongoRepository) {
        this.mongoRepository = mongoRepository;
    }

    @Override
    public Optional<StudyPlan> findByUserIdAndCourseId(UserId userId, CourseId courseId) {
        return mongoRepository.findByUserIdAndCourseId(userId.value(), courseId.value())
                .map(d -> new StudyPlan(
                        UserId.of(d.getUserId()),
                        CourseId.of(d.getCourseId()),
                        d.getChosenClassSessionIds().stream().map(ClassSessionId::of).toList(),
                        d.getUpdatedAt()));
    }

    @Override
    public StudyPlan save(StudyPlan plan) {
        String docId = plan.userId().value() + ":" + plan.courseId().value();
        var saved = mongoRepository.save(new StudyPlanDocument(
                docId,
                plan.userId().value(),
                plan.courseId().value(),
                plan.chosenClassSessionIds().stream().map(ClassSessionId::value).toList(),
                plan.updatedAt()
        ));
        return new StudyPlan(
                UserId.of(saved.getUserId()),
                CourseId.of(saved.getCourseId()),
                saved.getChosenClassSessionIds().stream().map(ClassSessionId::of).toList(),
                saved.getUpdatedAt());
    }
}
