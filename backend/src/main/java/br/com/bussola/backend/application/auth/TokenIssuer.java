package br.com.bussola.backend.application.auth;

import br.com.bussola.backend.domain.user.User;

/** Outbound port: JWT issuing is an infrastructure concern. */
public interface TokenIssuer {
    String issue(User user);
    long expiresInSeconds();
}
