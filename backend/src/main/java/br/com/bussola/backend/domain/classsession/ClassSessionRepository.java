package br.com.bussola.backend.domain.classsession;

import br.com.bussola.backend.domain.course.CourseId;

import java.util.List;
import java.util.Optional;

public interface ClassSessionRepository {
    List<ClassSession> findByCourseId(CourseId courseId);
    Optional<ClassSession> findById(ClassSessionId id);
    ClassSession save(ClassSession classSession);
    void deleteById(ClassSessionId id);
    boolean existsById(ClassSessionId id);
}
