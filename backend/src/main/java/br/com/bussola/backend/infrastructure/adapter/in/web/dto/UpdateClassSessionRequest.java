package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import java.util.List;

public record UpdateClassSessionRequest(String professor, String sala, List<WeeklySlotDto> sessions) {}
