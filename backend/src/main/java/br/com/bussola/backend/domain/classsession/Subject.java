package br.com.bussola.backend.domain.classsession;

/**
 * Value object representing the discipline as it exists under ONE curriculum
 * (2008 or 2023). A ClassSession carries up to two of these (curr2008 /
 * curr2023), exactly like the legacy JS records.
 */
public record Subject(String nome, String sigla, String codigo, String periodo, boolean ppgi) {

    public Subject {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome da disciplina é obrigatório");
        }
        if (sigla == null || sigla.isBlank()) {
            throw new IllegalArgumentException("Sigla da disciplina é obrigatória");
        }
    }

    public static Subject of(String nome, String sigla, String codigo, String periodo) {
        return new Subject(nome, sigla, codigo, periodo, false);
    }
}
