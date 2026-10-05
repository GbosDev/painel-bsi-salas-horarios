package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import br.com.bussola.backend.domain.syllabus.Syllabus;

public record SyllabusResponse(String codigo, String nome, String ementa) {
    public static SyllabusResponse from(Syllabus s) {
        return new SyllabusResponse(s.codigo(), s.nome(), s.ementa());
    }
}
