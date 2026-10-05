package br.com.bussola.backend.application.classsession;

import br.com.bussola.backend.domain.classsession.Section;
import br.com.bussola.backend.domain.classsession.Subject;
import br.com.bussola.backend.domain.classsession.WeeklySlot;

import java.util.List;

/** Application-layer input for creating/updating a ClassSession, decoupled from any DTO/JSON shape. */
public record ClassSessionCommand(
        String courseId,
        Subject curr2008,
        Subject curr2023,
        String professor,
        List<WeeklySlot> sessions,
        String sala,
        int vagas,
        Section section,
        String programa,
        String ementaUrl
) {}
