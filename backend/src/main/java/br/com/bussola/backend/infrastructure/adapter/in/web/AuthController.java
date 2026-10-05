package br.com.bussola.backend.infrastructure.adapter.in.web;

import br.com.bussola.backend.application.auth.AuthenticateUserUseCase;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.LoginRequest;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.LoginResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticateUserUseCase authenticateUserUseCase;

    public AuthController(AuthenticateUserUseCase authenticateUserUseCase) {
        this.authenticateUserUseCase = authenticateUserUseCase;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        var result = authenticateUserUseCase.execute(request.username(), request.password());
        return ResponseEntity.ok(LoginResponse.from(result));
    }
}
