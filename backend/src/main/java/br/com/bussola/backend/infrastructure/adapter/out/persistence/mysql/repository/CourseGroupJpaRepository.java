package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository;

import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.CourseGroupJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseGroupJpaRepository extends JpaRepository<CourseGroupJpaEntity, String> {
}
