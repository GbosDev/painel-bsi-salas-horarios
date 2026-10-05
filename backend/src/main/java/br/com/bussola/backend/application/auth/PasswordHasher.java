package br.com.bussola.backend.application.auth;

/** Outbound port: hashing/verification is an infrastructure concern (BCrypt). */
public interface PasswordHasher {
    String hash(String rawPassword);
    boolean matches(String rawPassword, String hash);
}
