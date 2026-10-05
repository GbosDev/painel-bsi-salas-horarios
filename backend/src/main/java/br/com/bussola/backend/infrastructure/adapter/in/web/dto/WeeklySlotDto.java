package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import br.com.bussola.backend.domain.classsession.WeeklySlot;

public record WeeklySlotDto(int dayNum, String dayLabel, String dayShort, int hour) {
    public static WeeklySlotDto from(WeeklySlot s) {
        return new WeeklySlotDto(s.dayNum(), s.dayLabel(), s.dayShort(), s.hour());
    }

    public WeeklySlot toDomain() {
        return new WeeklySlot(dayNum, dayLabel, dayShort, hour);
    }
}
