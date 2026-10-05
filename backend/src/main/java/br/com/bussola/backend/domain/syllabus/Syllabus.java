package br.com.bussola.backend.domain.syllabus;

/**
 * A discipline's "ementa" (syllabus), keyed by its curriculum code — mirrors
 * window.BSI_EMENTAS. Long free-text, variable per course/curriculum, never
 * joined relationally: a natural fit for MongoDB rather than MySQL.
 */
public record Syllabus(String codigo, String nome, String ementa) {
}
