package br.com.bussola.backend.domain.user;

import java.util.UUID;

public record UserId(String value) {
    public static UserId of(String value) { return new UserId(value); }
    public static UserId generate() { return new UserId(UUID.randomUUID().toString()); }

    @Override
    public String toString() { return value; }
}
