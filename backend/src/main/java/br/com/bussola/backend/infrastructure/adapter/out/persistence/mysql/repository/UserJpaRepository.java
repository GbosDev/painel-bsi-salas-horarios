package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository;

import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.UserJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserJpaRepository extends JpaRepository<UserJpaEntity, String> {
    Optional<UserJpaEntity> findByUsername(String username);
}
