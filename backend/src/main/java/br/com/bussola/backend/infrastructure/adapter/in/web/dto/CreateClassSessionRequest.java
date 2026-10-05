package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record CreateClassSessionRequest(
        SubjectDto curr2008,
        SubjectDto curr2023,
        String professor,
        @NotEmpty(message = "Informe ao menos um horário semanal") @Valid List<WeeklySlotDto> sessions,
        String sala,
        @PositiveOrZero(message = "Vagas não pode ser negativo") int vagas,
        String section,
        String programa,
        String ementaUrl
) {}
