package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository;

import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.ClassSessionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassSessionJpaRepository extends JpaRepository<ClassSessionJpaEntity, Long> {
    List<ClassSessionJpaEntity> findByCourseId(String courseId);
}
