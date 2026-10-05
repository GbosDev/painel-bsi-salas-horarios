package br.com.bussola.backend.infrastructure.adapter.in.web;

import br.com.bussola.backend.application.classsession.*;
import br.com.bussola.backend.domain.classsession.Section;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.ClassSessionResponse;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.CreateClassSessionRequest;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.UpdateClassSessionRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/class-sessions")
public class ClassSessionController {

    private final ListClassSessionsUseCase listUseCase;
    private final CreateClassSessionUseCase createUseCase;
    private final UpdateClassSessionUseCase updateUseCase;
    private final DeleteClassSessionUseCase deleteUseCase;

    public ClassSessionController(ListClassSessionsUseCase listUseCase, CreateClassSessionUseCase createUseCase,
                                    UpdateClassSessionUseCase updateUseCase, DeleteClassSessionUseCase deleteUseCase) {
        this.listUseCase = listUseCase;
        this.createUseCase = createUseCase;
        this.updateUseCase = updateUseCase;
        this.deleteUseCase = deleteUseCase;
    }

    @GetMapping
    public ResponseEntity<List<ClassSessionResponse>> list(@PathVariable String courseId) {
        return ResponseEntity.ok(listUseCase.execute(courseId).stream().map(ClassSessionResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<ClassSessionResponse> create(@PathVariable String courseId,
                                                          @Valid @RequestBody CreateClassSessionRequest request,
                                                          @AuthenticationPrincipal String actor) {
        var command = new ClassSessionCommand(
                courseId,
                request.curr2008() == null ? null : request.curr2008().toDomain(),
                request.curr2023() == null ? null : request.curr2023().toDomain(),
                request.professor(),
                request.sessions().stream().map(s -> s.toDomain()).toList(),
                request.sala(),
                request.vagas(),
                request.section() == null ? Section.REGULAR : Section.valueOf(request.section().toUpperCase()),
                request.programa(),
                request.ementaUrl()
        );
        var created = createUseCase.execute(command, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(ClassSessionResponse.from(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<ClassSessionResponse> update(@PathVariable String courseId, @PathVariable Long id,
                                                          @RequestBody UpdateClassSessionRequest request,
                                                          @AuthenticationPrincipal String actor) {
        var sessions = request.sessions() == null ? null : request.sessions().stream().map(s -> s.toDomain()).toList();
        var updated = updateUseCase.execute(id, request.professor(), request.sala(), sessions, actor);
        return ResponseEntity.ok(ClassSessionResponse.from(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<Void> delete(@PathVariable String courseId, @PathVariable Long id,
                                         @AuthenticationPrincipal String actor) {
        deleteUseCase.execute(id, actor);
        return ResponseEntity.noContent().build();
    }
}
