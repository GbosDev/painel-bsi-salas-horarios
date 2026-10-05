package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.adapter;

import br.com.bussola.backend.domain.course.Course;
import br.com.bussola.backend.domain.course.CourseGroup;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.course.CourseRepository;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.mapper.CourseMapper;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository.CourseGroupJpaRepository;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository.CourseJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class CourseRepositoryAdapter implements CourseRepository {

    private final CourseJpaRepository courseJpaRepository;
    private final CourseGroupJpaRepository courseGroupJpaRepository;

    public CourseRepositoryAdapter(CourseJpaRepository courseJpaRepository,
                                     CourseGroupJpaRepository courseGroupJpaRepository) {
        this.courseJpaRepository = courseJpaRepository;
        this.courseGroupJpaRepository = courseGroupJpaRepository;
    }

    @Override
    public List<Course> findAll() {
        return courseJpaRepository.findAll().stream().map(CourseMapper::toDomain).toList();
    }

    @Override
    public Optional<Course> findById(CourseId id) {
        return courseJpaRepository.findById(id.value()).map(CourseMapper::toDomain);
    }

    @Override
    public List<CourseGroup> findAllGroups() {
        return courseGroupJpaRepository.findAll().stream().map(CourseMapper::toDomain).toList();
    }

    @Override
    public Course save(Course course) {
        var saved = courseJpaRepository.save(CourseMapper.toEntity(course));
        return CourseMapper.toDomain(saved);
    }

    @Override
    public void deleteById(CourseId id) {
        courseJpaRepository.deleteById(id.value());
    }

    @Override
    public boolean existsById(CourseId id) {
        return courseJpaRepository.existsById(id.value());
    }
}
