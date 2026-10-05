package br.com.bussola.backend.domain.shared;

public class AuthenticationFailedException extends DomainException {
    public AuthenticationFailedException() {
        super("Usuário ou senha incorretos.");
    }
}
