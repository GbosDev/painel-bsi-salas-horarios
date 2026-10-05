package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SaveStudyPlanRequest(@NotNull List<Long> classSessionIds) {}
