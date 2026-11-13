package br.unirio.painel.plano;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.unirio.painel.apoio.FakesEmMemoria;
import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.configuracao.ManipuladorDeErros;
import br.unirio.painel.configuracao.RespostaDeErro;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

class ServicoDePlanoTest {

    final FakesEmMemoria.Catalogo catalogo = new FakesEmMemoria.Catalogo();
    final FakesEmMemoria.Turmas turmas = new FakesEmMemoria.Turmas();
    final FakesEmMemoria.Planos planos = new FakesEmMemoria.Planos();
    final ServicoDePlano servico = new ServicoDePlano(planos, turmas, catalogo, FakesEmMemoria.relogioFixo());

    Turma nova(String sigla, HorarioDeAula... h) {
        return nova("bsi", sigla, h);
    }

    Turma nova(String curso, String sigla, HorarioDeAula... h) {
        return turmas.salvar(new Turma(null, curso, new DisciplinaDaMatriz(2023, sigla, null, "Disciplina " + sigla, "1", false), null,
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

    @Test
    @DisplayName("BSI (aula de 2 h): mesmo início ou início na hora seguinte chocam; 14h e 16h não")
    void regraDoSlotNoBsi() {
        Turma a = nova("A", HorarioDeAula.deHoras(1, 14, 16));
        Turma b = nova("B", HorarioDeAula.deHoras(1, 15, 17));
        Turma c = nova("C", HorarioDeAula.deHoras(1, 16, 18));
        assertThrows(PlanoComConflitoException.class, () -> servico.salvar(7L, "bsi", List.of(a.id(), b.id())));
        assertEquals(List.of(a.id(), c.id()), servico.salvar(7L, "bsi", List.of(a.id(), c.id())).turmaIds());
    }

    @Test
    @DisplayName("curso com aula de 1 h: 14h e 15h no mesmo dia não chocam; mesmo início choca")
    void regraDoSlotEmCursoDeUmaHora() {
        Curso bsi = FakesEmMemoria.cursoBsi();
        catalogo.cursos.put("mat", new Curso("mat", "MAT", "Matemática", bsi.centroSigla(), bsi.centroNome(), bsi.centroDescricao(),
                bsi.situacao(), bsi.descricao(), bsi.tema(), false, 1));
        Turma a = nova("mat", "A", HorarioDeAula.deHoras(4, 14, 15));
        Turma b = nova("mat", "B", HorarioDeAula.deHoras(4, 15, 16));
        Turma c = nova("mat", "C", HorarioDeAula.deHoras(4, 14, 15));
        assertEquals(2, servico.salvar(7L, "mat", List.of(a.id(), b.id())).turmaIds().size());
        assertThrows(PlanoComConflitoException.class, () -> servico.salvar(7L, "mat", List.of(a.id(), c.id())));
    }

    @Test
    @DisplayName("com conflito → 409 com a lista de choques (dia, início, fim, turmas); sem conflito → salva")
    void conflitoViraHttp409() {
        Turma a = nova("A", HorarioDeAula.deHoras(3, 16, 18));
        Turma b = nova("B", HorarioDeAula.deHoras(3, 17, 19));
        Turma c = nova("C", HorarioDeAula.deHoras(4, 8, 10));
        PlanoComConflitoException e = assertThrows(PlanoComConflitoException.class,
                () -> servico.salvar(7L, "bsi", List.of(a.id(), b.id())));
        ResponseEntity<RespostaDeErro> resposta = new ManipuladorDeErros()
                .conflitoDePlano(e, new MockHttpServletRequest("PUT", "/api/v1/cursos/bsi/plano"));
        assertEquals(HttpStatus.CONFLICT, resposta.getStatusCode());
        RespostaDeErro corpo = resposta.getBody();
        assertNotNull(corpo);
        assertEquals("plano_com_conflito", corpo.codigo());
        assertEquals(List.of(new RespostaDeErro.Conflito(3, "17:00", "18:00", List.of(a.id(), b.id()),
                List.of("A — Disciplina A", "B — Disciplina B"))), corpo.conflitos());
        assertTrue(servico.obter(7L, "bsi").turmaIds().isEmpty());

        assertEquals(List.of(a.id(), c.id()), servico.salvar(7L, "bsi", List.of(a.id(), c.id())).turmaIds());
    }
}
