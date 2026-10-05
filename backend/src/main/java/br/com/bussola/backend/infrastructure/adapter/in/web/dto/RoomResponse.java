package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import br.com.bussola.backend.domain.room.Room;

public record RoomResponse(String id, String nome) {
    public static RoomResponse from(Room r) {
        return new RoomResponse(r.id().value(), r.nome());
    }
}
