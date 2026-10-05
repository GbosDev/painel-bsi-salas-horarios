package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import br.com.bussola.backend.application.room.RoomOccupancyUseCase;

public record RoomOccupancyResponse(String sala, boolean ocupada, ClassSessionResponse ocupante) {
    public static RoomOccupancyResponse from(RoomOccupancyUseCase.RoomStatus s) {
        return new RoomOccupancyResponse(s.sala(), s.ocupada(),
                s.ocupante() == null ? null : ClassSessionResponse.from(s.ocupante()));
    }
}
