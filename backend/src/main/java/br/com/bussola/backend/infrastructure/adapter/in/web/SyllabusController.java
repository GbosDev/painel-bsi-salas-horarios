package br.com.bussola.backend.infrastructure.adapter.in.web;

import br.com.bussola.backend.application.syllabus.FindSyllabusUseCase;
import br.com.bussola.backend.domain.shared.NotFoundException;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.SyllabusResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/syllabus")
public class SyllabusController {

    private final FindSyllabusUseCase findSyllabusUseCase;

    public SyllabusController(FindSyllabusUseCase findSyllabusUseCase) {
        this.findSyllabusUseCase = findSyllabusUseCase;
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<SyllabusResponse> find(@PathVariable String codigo) {
        var syllabus = findSyllabusUseCase.execute(codigo)
                .orElseThrow(() -> new NotFoundException("Ementa", codigo));
        return ResponseEntity.ok(SyllabusResponse.from(syllabus));
    }
}
