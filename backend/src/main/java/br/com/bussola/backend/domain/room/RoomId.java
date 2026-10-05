package br.com.bussola.backend.domain.room;

import java.util.UUID;

public record RoomId(String value) {
    public static RoomId of(String value) { return new RoomId(value); }
    public static RoomId generate() { return new RoomId(UUID.randomUUID().toString()); }

    @Override
    public String toString() { return value; }
}
