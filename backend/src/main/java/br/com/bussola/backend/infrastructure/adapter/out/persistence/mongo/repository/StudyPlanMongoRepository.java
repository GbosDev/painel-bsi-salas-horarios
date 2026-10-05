package br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.repository;

import br.com.bussola.backend.infrastructure.adapter.out.persistence.mongo.document.StudyPlanDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface StudyPlanMongoRepository extends MongoRepository<StudyPlanDocument, String> {
    Optional<StudyPlanDocument> findByUserIdAndCourseId(String userId, String courseId);
}
