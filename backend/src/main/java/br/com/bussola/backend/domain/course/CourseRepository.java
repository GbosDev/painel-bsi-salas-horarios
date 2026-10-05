package br.com.bussola.backend.domain.course;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port. Implemented by the MySQL JPA adapter
 * (infrastructure.adapter.out.persistence.mysql).
 */
public interface CourseRepository {
    List<Course> findAll();
    Optional<Course> findById(CourseId id);
    List<CourseGroup> findAllGroups();
    Course save(Course course);
    void deleteById(CourseId id);
    boolean existsById(CourseId id);
}
