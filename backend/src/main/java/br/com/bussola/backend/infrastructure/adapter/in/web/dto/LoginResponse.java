package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import br.com.bussola.backend.application.auth.AuthResult;

public record LoginResponse(String token, long expiresInSeconds, String username, String nome,
                              String role, String matricula, String courseId) {
    public static LoginResponse from(AuthResult r) {
        return new LoginResponse(r.token(), r.expiresInSeconds(), r.username(), r.nome(), r.role(),
                r.matricula(), r.courseId());
    }
}
