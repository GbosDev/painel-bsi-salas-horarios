package br.com.bussola.backend.application.auth;

import br.com.bussola.backend.domain.shared.AuthenticationFailedException;
import br.com.bussola.backend.domain.user.Role;
import br.com.bussola.backend.domain.user.User;
import br.com.bussola.backend.domain.user.UserId;
import br.com.bussola.backend.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticateUserUseCaseTest {

    @Mock UserRepository userRepository;
    @Mock PasswordHasher passwordHasher;
    @Mock TokenIssuer tokenIssuer;

    @Test
    void issuesTokenWhenCredentialsAreValid() {
        User jefferson = new User(UserId.of("u-jefferson"), "jefferson", "hashed", "Prof. Jefferson",
                Role.PROFESSOR, null, null);
        when(userRepository.findByUsername("jefferson")).thenReturn(Optional.of(jefferson));
        when(passwordHasher.matches("jef2026", "hashed")).thenReturn(true);
        when(tokenIssuer.issue(jefferson)).thenReturn("signed.jwt.token");
        when(tokenIssuer.expiresInSeconds()).thenReturn(28800L);

        var useCase = new AuthenticateUserUseCase(userRepository, passwordHasher, tokenIssuer);
        AuthResult result = useCase.execute("jefferson", "jef2026");

        assertEquals("signed.jwt.token", result.token());
        assertEquals("PROFESSOR", result.role());
    }

    @Test
    void rejectsUnknownUsername() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());
        var useCase = new AuthenticateUserUseCase(userRepository, passwordHasher, tokenIssuer);

        assertThrows(AuthenticationFailedException.class, () -> useCase.execute("ghost", "whatever"));
    }

    @Test
    void rejectsWrongPassword() {
        User ana = new User(UserId.of("u-ana"), "ana", "hashed", "Ana Souza", Role.ALUNO, "2026100101",
                br.com.bussola.backend.domain.course.CourseId.of("bsi"));
        when(userRepository.findByUsername("ana")).thenReturn(Optional.of(ana));
        when(passwordHasher.matches("wrong", "hashed")).thenReturn(false);

        var useCase = new AuthenticateUserUseCase(userRepository, passwordHasher, tokenIssuer);
        assertThrows(AuthenticationFailedException.class, () -> useCase.execute("ana", "wrong"));
    }
}
