package br.com.bussola.backend.application.auth;

public record AuthResult(String token, long expiresInSeconds, String username, String nome,
                           String role, String matricula, String courseId) {
}
