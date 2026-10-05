package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.adapter;

import br.com.bussola.backend.domain.user.User;
import br.com.bussola.backend.domain.user.UserRepository;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.mapper.UserMapper;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.repository.UserJpaRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class UserRepositoryAdapter implements UserRepository {

    private final UserJpaRepository jpaRepository;

    public UserRepositoryAdapter(UserJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return jpaRepository.findByUsername(username).map(UserMapper::toDomain);
    }

    @Override
    public User save(User user) {
        var saved = jpaRepository.save(UserMapper.toEntity(user));
        return UserMapper.toDomain(saved);
    }
}
