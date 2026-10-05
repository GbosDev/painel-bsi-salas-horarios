package br.com.bussola.backend.infrastructure.adapter.in.web;

import br.com.bussola.backend.application.plan.GetStudyPlanUseCase;
import br.com.bussola.backend.application.plan.SaveStudyPlanUseCase;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.SaveStudyPlanRequest;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.StudyPlanResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Server-side "Meu plano" persistence — scoped to the authenticated student, never another user's data. */
@RestController
@RequestMapping("/api/courses/{courseId}/plan")
@PreAuthorize("hasRole('ALUNO')")
public class StudyPlanController {

    private final GetStudyPlanUseCase getStudyPlanUseCase;
    private final SaveStudyPlanUseCase saveStudyPlanUseCase;

    public StudyPlanController(GetStudyPlanUseCase getStudyPlanUseCase, SaveStudyPlanUseCase saveStudyPlanUseCase) {
        this.getStudyPlanUseCase = getStudyPlanUseCase;
        this.saveStudyPlanUseCase = saveStudyPlanUseCase;
    }

    @GetMapping
    public ResponseEntity<StudyPlanResponse> get(@PathVariable String courseId,
                                                    @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(StudyPlanResponse.from(getStudyPlanUseCase.execute(username, courseId)));
    }

    @PutMapping
    public ResponseEntity<StudyPlanResponse> save(@PathVariable String courseId,
                                                     @Valid @RequestBody SaveStudyPlanRequest request,
                                                     @AuthenticationPrincipal String username) {
        var result = saveStudyPlanUseCase.execute(username, courseId, request.classSessionIds());
        return ResponseEntity.ok(StudyPlanResponse.from(result));
    }
}
