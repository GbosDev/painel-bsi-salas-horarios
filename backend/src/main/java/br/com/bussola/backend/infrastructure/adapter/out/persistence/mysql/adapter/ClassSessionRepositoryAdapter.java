package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.adapter;

import br.com.bussola.backend.domain.classsession.ClassSession;
import br.com.bussola.backend.domain.classsession.ClassSessionId;
import br.com.bussola.backend.domain.classsession.ClassSessionRepository;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.mapper.ClassSessionMapper;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository.ClassSessionJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class ClassSessionRepositoryAdapter implements ClassSessionRepository {

    private final ClassSessionJpaRepository jpaRepository;

    public ClassSessionRepositoryAdapter(ClassSessionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public List<ClassSession> findByCourseId(CourseId courseId) {
        return jpaRepository.findByCourseId(courseId.value()).stream()
                .map(ClassSessionMapper::toDomain).toList();
    }

    @Override
    public Optional<ClassSession> findById(ClassSessionId id) {
        return jpaRepository.findById(id.value()).map(ClassSessionMapper::toDomain);
    }

    @Override
    public ClassSession save(ClassSession classSession) {
        var saved = jpaRepository.save(ClassSessionMapper.toEntity(classSession));
        return ClassSessionMapper.toDomain(saved);
    }

    @Override
    public void deleteById(ClassSessionId id) {
        jpaRepository.deleteById(id.value());
    }

    @Override
    public boolean existsById(ClassSessionId id) {
        return jpaRepository.existsById(id.value());
    }
}
