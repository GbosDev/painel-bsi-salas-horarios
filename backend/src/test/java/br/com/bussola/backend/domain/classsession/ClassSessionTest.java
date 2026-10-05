package br.com.bussola.backend.domain.classsession;

import br.com.bussola.backend.domain.course.CourseId;
import br.com.bussola.backend.domain.shared.BusinessRuleViolationException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ClassSessionTest {

    private final CourseId bsi = CourseId.of("bsi");
    private final Subject ap1 = Subject.of("Algoritmos e Programação I", "AP1", "BSI001", "1");
    private final WeeklySlot mon8 = new WeeklySlot(1, "Segunda-feira", "Seg", 8);

    @Test
    void createsWithAtLeastOneCurriculum() {
        ClassSession cs = ClassSession.create(bsi, null, ap1, "Prof. Jefferson", List.of(mon8),
                "Sala 301", 40, Section.REGULAR, null, null);
        assertNotNull(cs.id());
        assertEquals(ap1, cs.curr2023());
    }

    @Test
    void rejectsClassSessionWithoutAnyCurriculum() {
        assertThrows(BusinessRuleViolationException.class, () ->
                ClassSession.create(bsi, null, null, "Prof. Jefferson", List.of(mon8),
                        "Sala 301", 40, Section.REGULAR, null, null));
    }

    @Test
    void rejectsClassSessionWithoutWeeklySlots() {
        assertThrows(BusinessRuleViolationException.class, () ->
                ClassSession.create(bsi, null, ap1, "Prof. Jefferson", List.of(),
                        "Sala 301", 40, Section.REGULAR, null, null));
    }

    @Test
    void rejectsNegativeVagas() {
        assertThrows(BusinessRuleViolationException.class, () ->
                ClassSession.create(bsi, null, ap1, "Prof. Jefferson", List.of(mon8),
                        "Sala 301", -1, Section.REGULAR, null, null));
    }

    @Test
    void detectsClashBetweenTwoClassSessionsSharingDayAndHour() {
        ClassSession a = ClassSession.create(bsi, null, ap1, "Prof. Jefferson", List.of(mon8),
                "Sala 301", 40, Section.REGULAR, null, null);
        ClassSession b = ClassSession.create(bsi, null,
                Subject.of("Banco de Dados I", "BD1", "BSI014", "4"),
                "Prof. Jobson", List.of(mon8), "Lab. 101", 35, Section.REGULAR, null, null);

        assertTrue(a.clashesWith(b));
        assertTrue(b.clashesWith(a));
    }

    @Test
    void occupiesRoomAtOnlyMatchesConfiguredRoomDayAndHour() {
        ClassSession cs = ClassSession.create(bsi, null, ap1, "Prof. Jefferson", List.of(mon8),
                "Sala 301", 40, Section.REGULAR, null, null);

        assertTrue(cs.occupiesRoomAt("Sala 301", 1, 8));
        assertFalse(cs.occupiesRoomAt("Sala 301", 1, 10));
        assertFalse(cs.occupiesRoomAt("Sala 302", 1, 8));
    }

    @Test
    void applyEditReplacesProfessorRoomAndSessionsInPlace() {
        ClassSession cs = ClassSession.create(bsi, null, ap1, "Prof. Jefferson", List.of(mon8),
                "Sala 301", 40, Section.REGULAR, null, null);

        WeeklySlot wed10 = new WeeklySlot(3, "Quarta-feira", "Qua", 10);
        cs.applyEdit("Prof. Jobson", "Sala 302", List.of(wed10));

        assertEquals("Prof. Jobson", cs.professor());
        assertEquals("Sala 302", cs.sala());
        assertEquals(List.of(wed10), cs.sessions());
    }
}
