package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AddRoomRequest(@NotBlank(message = "Nome da sala é obrigatório") String nome) {}
