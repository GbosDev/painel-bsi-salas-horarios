package br.unirio.painel.plano;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.unirio.painel.apoio.FakesEmMemoria;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.oferta.dominio.DisciplinaDaMatriz;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import br.unirio.painel.oferta.dominio.Origem;
import br.unirio.painel.oferta.dominio.Secao;
import br.unirio.painel.oferta.dominio.Turma;
import br.unirio.painel.plano.aplicacao.PlanoComConflitoException;
import br.unirio.painel.plano.aplicacao.ServicoDePlano;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ServicoDePlanoTest {

    final FakesEmMemoria.Catalogo catalogo = new FakesEmMemoria.Catalogo();
    final FakesEmMemoria.Turmas turmas = new FakesEmMemoria.Turmas();
    final FakesEmMemoria.Planos planos = new FakesEmMemoria.Planos();
    final ServicoDePlano servico = new ServicoDePlano(planos, turmas, catalogo, FakesEmMemoria.relogioFixo());

    Turma nova(String sigla, HorarioDeAula... h) {
        return turmas.salvar(new Turma(null, "bsi", new DisciplinaDaMatriz(2023, sigla, null, "Disciplina " + sigla, "1", false), null,
                "Prof.", "Sala 212", 30, Secao.REGULAR, null, Origem.CSV, 0, List.of(h)));
    }

    @Test
    @DisplayName("plano sem choque é gravado e devolvido")
    void salvaPlano() {
        Turma a = nova("A", HorarioDeAula.deHoras(2, 14, 16));
        Turma b = nova("B", HorarioDeAula.deHoras(2, 16, 18));
        var salvo = servico.salvar(7L, "bsi", List.of(a.id(), b.id()));
        assertEquals(List.of(a.id(), b.id()), salvo.turmaIds());
        assertEquals(List.of(a.id(), b.id()), servico.obter(7L, "bsi").turmaIds());
    }

    @Test
    @DisplayName("choque por sobreposição parcial é recusado e nada é gravado")
    void recusaConflito() {
        Turma a = nova("A", HorarioDeAula.deHoras(2, 14, 16));
        Turma b = nova("B", new HorarioDeAula(2, LocalTime.of(15, 0), LocalTime.of(17, 0)));
        PlanoComConflitoException e = assertThrows(PlanoComConflitoException.class, () -> servico.salvar(7L, "bsi", List.of(a.id(), b.id())));
        assertEquals(1, e.conflitos().size());
        assertTrue(servico.obter(7L, "bsi").turmaIds().isEmpty());
    }

    @Test
    @DisplayName("turma inexistente ou excluída não entra no plano")
    void turmaInvalida() {
        Turma a = nova("A", HorarioDeAula.deHoras(2, 14, 16));
        turmas.marcarComoExcluida(a.id(), null);
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class, () -> servico.salvar(7L, "bsi", List.of(a.id(), 999L)));
        assertEquals("plano_turma_invalida", e.codigo());
    }

    @Test
    @DisplayName("ids repetidos são tratados como um só; turma excluída depois some do plano salvo")
    void duplicadosEExcluidas() {
        Turma a = nova("A", HorarioDeAula.deHoras(2, 14, 16));
        Turma b = nova("B", HorarioDeAula.deHoras(3, 14, 16));
        assertEquals(2, servico.salvar(7L, "bsi", List.of(a.id(), a.id(), b.id())).turmaIds().size());
        turmas.marcarComoExcluida(b.id(), null);
        assertEquals(List.of(a.id()), servico.obter(7L, "bsi").turmaIds());
    }
}
