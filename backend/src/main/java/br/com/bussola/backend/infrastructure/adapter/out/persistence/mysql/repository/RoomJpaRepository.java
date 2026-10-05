package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository;

import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.RoomJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomJpaRepository extends JpaRepository<RoomJpaEntity, String> {
    List<RoomJpaEntity> findByCourseId(String courseId);
    Optional<RoomJpaEntity> findByCourseIdAndNomeIgnoreCase(String courseId, String nome);
}
