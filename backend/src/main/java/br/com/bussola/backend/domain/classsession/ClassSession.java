package br.com.bussola.backend.domain.classsession;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.shared.BusinessRuleViolationException;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Aggregate root for a "turma" (class session) — the central entity of the
 * domain, mirroring one record of horario-data.js / eng-data.js / ibio-data.js.
 *
 * Invariants enforced here (previously only loosely enforced, or not at all,
 * on the client):
 *  - at least one of curr2008 / curr2023 must be present;
 *  - at least one weekly slot must be scheduled;
 *  - vagas (capacity) cannot be negative.
 */
public class ClassSession {

    private ClassSessionId id;
    private final CourseId courseId;
    private Subject curr2008;
    private Subject curr2023;
    private String professor;
    private List<WeeklySlot> sessions;
    private String sala;
    private int vagas;
    private Section section;
    private String programa;
    private String ementaUrl;

    public ClassSession(ClassSessionId id, CourseId courseId, Subject curr2008, Subject curr2023,
                         String professor, List<WeeklySlot> sessions, String sala, int vagas,
                         Section section, String programa, String ementaUrl) {
        this.id = id;
        this.courseId = Objects.requireNonNull(courseId, "courseId é obrigatório");
        this.curr2008 = curr2008;
        this.curr2023 = curr2023;
        this.professor = professor;
        this.sala = sala;
        this.section = section == null ? Section.REGULAR : section;
        this.programa = programa;
        this.ementaUrl = ementaUrl;
        setSessions(sessions);
        setVagas(vagas);
        validateHasAtLeastOneCurriculum();
    }

    public static ClassSession create(CourseId courseId, Subject curr2008, Subject curr2023,
                                        String professor, List<WeeklySlot> sessions, String sala,
                                        int vagas, Section section, String programa, String ementaUrl) {
        return new ClassSession(ClassSessionId.generate(), courseId, curr2008, curr2023, professor,
                sessions, sala, vagas, section, programa, ementaUrl);
    }

    private void validateHasAtLeastOneCurriculum() {
        if (curr2008 == null && curr2023 == null) {
            throw new BusinessRuleViolationException(
                    "A turma precisa estar associada a ao menos uma matriz curricular (2008 ou 2023)");
        }
    }

    public void reassignProfessor(String novoProfessor) {
        this.professor = novoProfessor;
    }

    public void reassignRoom(String novaSala) {
        this.sala = novaSala;
    }

    public void reschedule(List<WeeklySlot> novosHorarios) {
        setSessions(novosHorarios);
    }

    public void applyEdit(String professor, String sala, List<WeeklySlot> sessions) {
        if (professor != null) reassignProfessor(professor);
        reassignRoom(sala);
        if (sessions != null && !sessions.isEmpty()) reschedule(sessions);
    }

    private void setSessions(List<WeeklySlot> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            throw new BusinessRuleViolationException("A turma precisa de ao menos um horário semanal");
        }
        this.sessions = new ArrayList<>(sessions);
    }

    private void setVagas(int vagas) {
        if (vagas < 0) {
            throw new BusinessRuleViolationException("Número de vagas não pode ser negativo");
        }
        this.vagas = vagas;
    }

    /** Used by room-occupancy queries: does this class use `room` at (day, hour)? */
    public boolean occupiesRoomAt(String room, int dayNum, int hour) {
        if (sala == null || !sala.equalsIgnoreCase(room)) return false;
        return sessions.stream().anyMatch(s -> s.dayNum() == dayNum && s.hour() == hour);
    }

    /** Used by the student planner to detect schedule clashes between two chosen turmas. */
    public boolean clashesWith(ClassSession other) {
        if (other == null || other == this) return false;
        for (WeeklySlot a : this.sessions) {
            for (WeeklySlot b : other.sessions) {
                if (a.overlaps(b)) return true;
            }
        }
        return false;
    }

    public void assignId(ClassSessionId id) {
        if (this.id != null) {
            throw new IllegalStateException("ClassSession já possui id");
        }
        this.id = id;
    }

    public ClassSessionId id() { return id; }
    public CourseId courseId() { return courseId; }
    public Subject curr2008() { return curr2008; }
    public Subject curr2023() { return curr2023; }
    public String professor() { return professor; }
    public List<WeeklySlot> sessions() { return List.copyOf(sessions); }
    public String sala() { return sala; }
    public int vagas() { return vagas; }
    public Section section() { return section; }
    public String programa() { return programa; }
    public String ementaUrl() { return ementaUrl; }

    /** Preferred subject label: 2023 curriculum first, falling back to 2008. */
    public Subject preferredSubject(String gradePreference) {
        if ("2008".equals(gradePreference)) {
            return curr2008 != null ? curr2008 : curr2023;
        }
        return curr2023 != null ? curr2023 : curr2008;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ClassSession other)) return false;
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
