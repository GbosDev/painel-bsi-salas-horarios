package br.com.bussola.backend.application.auth;

import br.com.bussola.backend.domain.shared.AuthenticationFailedException;
import br.com.bussola.backend.domain.user.User;
import br.com.bussola.backend.domain.user.UserRepository;
import org.springframework.stereotype.Service;

/**
 * Replaces the legacy client-side-only BussolaAuth.login: credentials are
 * now verified server-side against a hashed password, and a signed JWT is
 * returned instead of a trusted-by-default localStorage session object.
 */
@Service
public class AuthenticateUserUseCase {

    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;
    private final TokenIssuer tokenIssuer;

    public AuthenticateUserUseCase(UserRepository userRepository, PasswordHasher passwordHasher,
                                     TokenIssuer tokenIssuer) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.tokenIssuer = tokenIssuer;
    }

    public AuthResult execute(String username, String rawPassword) {
        User user = userRepository.findByUsername(normalize(username))
                .orElseThrow(AuthenticationFailedException::new);

        if (!passwordHasher.matches(rawPassword, user.passwordHash())) {
            throw new AuthenticationFailedException();
        }

        String token = tokenIssuer.issue(user);
        return new AuthResult(
                token,
                tokenIssuer.expiresInSeconds(),
                user.username(),
                user.nome(),
                user.role().name(),
                user.matricula(),
                user.courseId() == null ? null : user.courseId().value()
        );
    }

    private String normalize(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }
}
