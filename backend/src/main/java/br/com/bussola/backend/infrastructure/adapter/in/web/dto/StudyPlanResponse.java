package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import br.com.bussola.backend.application.plan.SaveStudyPlanUseCase;
import br.com.bussola.backend.domain.classsession.ClassSessionId;
import br.com.bussola.backend.domain.plan.StudyPlan;

import java.util.List;

public record StudyPlanResponse(List<Long> chosenClassSessionIds, List<ConflictDto> conflicts) {

    public record ConflictDto(Long a, Long b) {}

    public static StudyPlanResponse from(StudyPlan plan) {
        return new StudyPlanResponse(plan.chosenClassSessionIds().stream().map(ClassSessionId::value).toList(), List.of());
    }

    public static StudyPlanResponse from(SaveStudyPlanUseCase.Result result) {
        return new StudyPlanResponse(
                result.plan().chosenClassSessionIds().stream().map(ClassSessionId::value).toList(),
                result.conflicts().stream().map(c -> new ConflictDto(c.a(), c.b())).toList()
        );
    }
}
