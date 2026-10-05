package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository;

import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.CourseJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseJpaRepository extends JpaRepository<CourseJpaEntity, String> {
}
