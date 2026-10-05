package br.com.bussola.backend.infrastructure.security;

import br.com.bussola.backend.application.auth.TokenIssuer;
import br.com.bussola.backend.domain.user.User;
import br.com.bussola.backend.infrastructure.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;

/**
 * Outbound adapter implementing the TokenIssuer port with signed JWTs
 * (HS256), replacing the legacy plaintext localStorage "session" object.
 */
@Component
public class JwtService implements TokenIssuer {

    private final SecretKey key;
    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(normalizeTo256Bits(properties.getSecret()));
    }

    @Override
    public String issue(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(properties.getExpirationSeconds());
        return Jwts.builder()
                .subject(user.username())
                .claim("role", user.role().name())
                .claim("nome", user.nome())
                .claim("matricula", user.matricula())
                .claim("courseId", user.courseId() == null ? null : user.courseId().value())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    @Override
    public long expiresInSeconds() {
        return properties.getExpirationSeconds();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    /** jjwt requires at least 256 bits for HS256; we derive a fixed-length key via SHA-256 if needed. */
    private static byte[] normalizeTo256Bits(String secret) {
        byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
        if (raw.length >= 32) {
            return raw;
        }
        try {
            return MessageDigest.getInstance("SHA-256").digest(raw);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 não disponível", e);
        }
    }
}
