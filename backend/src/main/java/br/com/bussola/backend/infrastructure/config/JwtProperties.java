package br.com.bussola.backend.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bussola.jwt")
public class JwtProperties {

    /** Base64 or plain secret; in production this MUST come from an environment variable. */
    private String secret = "change-me-this-is-a-development-only-secret-key-please-override";
    private long expirationSeconds = 3600 * 8; // 8h

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public long getExpirationSeconds() { return expirationSeconds; }
    public void setExpirationSeconds(long expirationSeconds) { this.expirationSeconds = expirationSeconds; }
}
