package br.unirio.painel.oferta;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.oferta.dominio.ConflitoDeHorario;
import br.unirio.painel.oferta.dominio.ConflitosDeHorario;
import br.unirio.painel.oferta.dominio.DisciplinaDaMatriz;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import br.unirio.painel.oferta.dominio.Origem;
import br.unirio.painel.oferta.dominio.Secao;
import br.unirio.painel.oferta.dominio.Turma;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class HorarioEConflitosTest {

    static Turma turma(long id, String sigla, HorarioDeAula... horarios) {
        return new Turma(id, "bsi", new DisciplinaDaMatriz(2023, sigla, "TIN0001", "Disciplina " + sigla, "1", false), null,
                "Prof. X", "Sala 212", 40, Secao.REGULAR, null, Origem.CSV, 0, List.of(horarios));
    }

    @Test
    @DisplayName("horários que apenas encostam (14–16 e 16–18) não colidem")
    void encostarNaoColide() {
        assertFalse(HorarioDeAula.deHoras(2, 14, 16).sobrepoe(HorarioDeAula.deHoras(2, 16, 18)));
    }

    @Test
    @DisplayName("intervalos que se cruzam parcialmente colidem, mesmo com horas de início diferentes")
    void cruzamentoParcialColide() {
        assertTrue(HorarioDeAula.deHoras(2, 14, 16).sobrepoe(new HorarioDeAula(2, LocalTime.of(15, 0), LocalTime.of(17, 0))));
    }

    @Test
    @DisplayName("dias diferentes nunca colidem")
    void diasDiferentes() {
        assertFalse(HorarioDeAula.deHoras(2, 14, 16).sobrepoe(HorarioDeAula.deHoras(3, 14, 16)));
    }

    @Test
    @DisplayName("horário com fim antes do início é rejeitado")
    void intervaloInvalido() {
        assertThrows(ErroDeNegocio.class, () -> new HorarioDeAula(1, LocalTime.of(10, 0), LocalTime.of(9, 0)));
        assertThrows(ErroDeNegocio.class, () -> HorarioDeAula.deHoras(7, 10, 11));
    }

    @Test
    @DisplayName("turma rejeita horários que se cruzam dentro dela e remove duplicatas exatas")
    void turmaValidaHorarios() {
        assertThrows(ErroDeNegocio.class, () -> turma(1, "A", HorarioDeAula.deHoras(1, 8, 10), HorarioDeAula.deHoras(1, 9, 11)));
        Turma t = turma(1, "A", HorarioDeAula.deHoras(1, 8, 10), HorarioDeAula.deHoras(1, 8, 10));
        assertEquals(1, t.horarios().size());
    }

    @Test
    @DisplayName("turma precisa de disciplina em pelo menos uma grade")
    void turmaSemDisciplina() {
        assertThrows(ErroDeNegocio.class, () -> new Turma(1L, "bsi", null, null, null, null, 0, null, null, null, 0, List.of()));
    }

    @Test
    @DisplayName("conflito é detectado por intervalo e informa a janela comum")
    void detectaConflito() {
        Turma a = turma(1, "AAA", HorarioDeAula.deHoras(2, 14, 16));
        Turma b = turma(2, "BBB", new HorarioDeAula(2, LocalTime.of(15, 0), LocalTime.of(17, 0)));
        Turma c = turma(3, "CCC", HorarioDeAula.deHoras(2, 17, 19)); // encosta em B (17h) sem cruzar
        List<ConflitoDeHorario> conflitos = ConflitosDeHorario.entre(List.of(a, b, c));
        assertEquals(1, conflitos.size());
        assertEquals(LocalTime.of(15, 0), conflitos.get(0).inicio());
        assertEquals(LocalTime.of(16, 0), conflitos.get(0).fim());
        assertEquals(List.of(1L, 2L), conflitos.get(0).turmaIds());
    }

    @Test
    @DisplayName("sem sobreposição, nenhum conflito")
    void semConflito() {
        Turma a = turma(1, "AAA", HorarioDeAula.deHoras(2, 14, 16), HorarioDeAula.deHoras(4, 14, 16));
        Turma b = turma(2, "BBB", HorarioDeAula.deHoras(2, 16, 18), HorarioDeAula.deHoras(3, 14, 16));
        assertTrue(ConflitosDeHorario.entre(List.of(a, b)).isEmpty());
    }
}
