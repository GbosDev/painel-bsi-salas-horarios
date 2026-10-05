package br.com.bussola.backend.domain.course;

/** Mirrors BUSSOLA_GROUPS (e.g. the "ibio" grouping used by the course switcher). */
public record CourseGroup(String id, String sigla, String nome, String descricao) {
}
