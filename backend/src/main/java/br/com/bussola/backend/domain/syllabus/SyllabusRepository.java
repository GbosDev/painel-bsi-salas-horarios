package br.com.bussola.backend.domain.syllabus;

import java.util.Optional;

public interface SyllabusRepository {
    Optional<Syllabus> findByCodigo(String codigo);
    Syllabus save(Syllabus syllabus);
}
