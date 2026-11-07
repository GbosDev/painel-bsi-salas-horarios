package br.unirio.painel.acesso.infra;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioJpaRepository extends JpaRepository<UsuarioJpa, Long> {

    Optional<UsuarioJpa> findByLogin(String login);

    Optional<UsuarioJpa> findByMatricula(String matricula);

    boolean existsByAdministradorTrue();
}
