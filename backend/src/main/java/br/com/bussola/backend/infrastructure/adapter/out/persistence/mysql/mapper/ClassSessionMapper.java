package br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.mapper;

import br.com.bussola.backend.domain.classsession.*;
import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.ClassSessionJpaEntity;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.SubjectEmbeddable;
import br.com.bussola.backend.infrastructure.adapter.out.persistence.mysql.entity.WeeklySlotEmbeddable;

import java.util.List;

public final class ClassSessionMapper {

    private ClassSessionMapper() {}

    public static ClassSession toDomain(ClassSessionJpaEntity e) {
        return new ClassSession(
                ClassSessionId.of(e.getId()),
                CourseId.of(e.getCourseId()),
                toDomainSubject(e.getCurr2008()),
                toDomainSubject(e.getCurr2023()),
                e.getProfessor(),
                e.getSessions().stream().map(ClassSessionMapper::toDomainSlot).toList(),
                e.getSala(),
                e.getVagas(),
                Section.valueOf(e.getSection().name()),
                e.getPrograma(),
                e.getEmentaUrl()
        );
    }

    public static ClassSessionJpaEntity toEntity(ClassSession c) {
        List<WeeklySlotEmbeddable> slots = c.sessions().stream()
                .map(s -> new WeeklySlotEmbeddable(s.dayNum(), s.dayLabel(), s.dayShort(), s.hour()))
                .toList();
        return new ClassSessionJpaEntity(
                c.id() == null ? null : c.id().value(),
                c.courseId().value(),
                toEmbeddable(c.curr2008()),
                toEmbeddable(c.curr2023()),
                c.professor(),
                c.sala(),
                c.vagas(),
                ClassSessionJpaEntity.SectionJpa.valueOf(c.section().name()),
                c.programa(),
                c.ementaUrl(),
                slots
        );
    }

    private static Subject toDomainSubject(SubjectEmbeddable e) {
        if (e == null || e.getNome() == null) return null;
        return new Subject(e.getNome(), e.getSigla(), e.getCodigo(), e.getPeriodo(), e.isPpgi());
    }

    private static SubjectEmbeddable toEmbeddable(Subject s) {
        if (s == null) return null;
        return new SubjectEmbeddable(s.nome(), s.sigla(), s.codigo(), s.periodo(), s.ppgi());
    }

    private static WeeklySlot toDomainSlot(WeeklySlotEmbeddable e) {
        return new WeeklySlot(e.getDayNum(), e.getDayLabel(), e.getDayShort(), e.getHour());
    }
}
