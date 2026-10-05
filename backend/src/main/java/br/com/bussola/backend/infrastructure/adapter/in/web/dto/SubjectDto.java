package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import br.com.bussola.backend.domain.classsession.Subject;

public record SubjectDto(String nome, String sigla, String codigo, String periodo, boolean ppgi) {
    public static SubjectDto from(Subject s) {
        if (s == null) return null;
        return new SubjectDto(s.nome(), s.sigla(), s.codigo(), s.periodo(), s.ppgi());
    }

    public Subject toDomain() {
        return new Subject(nome, sigla, codigo, periodo, ppgi);
    }
}
