package br.com.bussola.backend.application.syllabus;

import br.com.bussola.backend.domain.syllabus.Syllabus;
import br.com.bussola.backend.domain.syllabus.SyllabusRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class FindSyllabusUseCase {

    private final SyllabusRepository syllabusRepository;

    public FindSyllabusUseCase(SyllabusRepository syllabusRepository) {
        this.syllabusRepository = syllabusRepository;
    }

    public Optional<Syllabus> execute(String codigo) {
        return syllabusRepository.findByCodigo(codigo);
    }
}
