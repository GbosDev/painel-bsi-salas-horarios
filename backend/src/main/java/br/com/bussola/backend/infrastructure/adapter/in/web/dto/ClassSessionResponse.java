package br.com.bussola.backend.infrastructure.adapter.in.web.dto;

import br.com.bussola.backend.domain.classsession.ClassSession;

import java.util.List;

public record ClassSessionResponse(
        Long id, String courseId, SubjectDto curr2008, SubjectDto curr2023, String professor,
        List<WeeklySlotDto> sessions, String sala, int vagas, String section,
        String programa, String ementaUrl
) {
    public static ClassSessionResponse from(ClassSession c) {
        return new ClassSessionResponse(
                c.id().value(), c.courseId().value(), SubjectDto.from(c.curr2008()), SubjectDto.from(c.curr2023()),
                c.professor(), c.sessions().stream().map(WeeklySlotDto::from).toList(), c.sala(), c.vagas(),
                c.section().name().toLowerCase(), c.programa(), c.ementaUrl()
        );
    }
}
