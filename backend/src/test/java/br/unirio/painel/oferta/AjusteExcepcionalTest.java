package br.unirio.painel.oferta;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.unirio.painel.apoio.FakesEmMemoria;
import br.unirio.painel.auditoria.dominio.Autor;
import br.unirio.painel.auditoria.dominio.TipoDeAlteracao;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.oferta.aplicacao.AjusteExcepcional;
import br.unirio.painel.oferta.aplicacao.AjusteExcepcional.DadosDeAjuste;
import br.unirio.painel.oferta.aplicacao.AjusteExcepcional.DadosDeNovaTurma;
import br.unirio.painel.oferta.dominio.DisciplinaDaMatriz;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import br.unirio.painel.oferta.dominio.Origem;
import br.unirio.painel.oferta.dominio.Secao;
import br.unirio.painel.oferta.dominio.Turma;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AjusteExcepcionalTest {

    final FakesEmMemoria.Catalogo catalogo = new FakesEmMemoria.Catalogo();
    final FakesEmMemoria.Turmas turmas = new FakesEmMemoria.Turmas();
    final FakesEmMemoria.Auditoria auditoria = new FakesEmMemoria.Auditoria();
    final AjusteExcepcional servico;
    final Autor autor = new Autor(1L, "Coordenação", "PROFESSOR");
    final Turma existente;

    AjusteExcepcionalTest() {
        catalogo.turmas = turmas;
        servico = new AjusteExcepcional(turmas, catalogo, auditoria, FakesEmMemoria.relogioFixo());
        existente = turmas.salvar(new Turma(null, "bsi", new DisciplinaDaMatriz(2023, "FSI", "TIN0206", "Fundamentos de SI", "1", false), null,
                "Prof. Rodrigo", "Sala 212", 40, Secao.REGULAR, null, Origem.LEGADO, 0, List.of(HorarioDeAula.deHoras(5, 14, 16))));
    }

    @Test
    @DisplayName("edição exige motivo com pelo menos 8 caracteres e não altera nada sem ele")
    void exigeMotivo() {
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class, () -> servico.editar(existente.id(),
                new DadosDeAjuste("Prof. Novo", "Sala 212", 40, existente.horarios(), null), "curto", autor));
        assertEquals("motivo_obrigatorio", e.codigo());
        assertEquals("Prof. Rodrigo", turmas.buscar(existente.id()).orElseThrow().professor());
        assertTrue(auditoria.registros.isEmpty());
    }

    @Test
    @DisplayName("edição grava a turma e um registro de auditoria com antes/depois e autor")
    void editaEAudita() {
        var r = servico.editar(existente.id(), new DadosDeAjuste("Prof. Novo", "Lab. 1", 35,
                List.of(HorarioDeAula.deHoras(5, 16, 18)), 0), "Troca por conflito de reserva em 12/11", autor);
        assertEquals("Prof. Novo", r.turma().professor());
        assertEquals(1, auditoria.registros.size());
        var reg = auditoria.registros.get(0);
        assertEquals(TipoDeAlteracao.EXCEPCIONAL_EDICAO, reg.tipo());
        assertEquals("Prof. Rodrigo", reg.antes().get("professor"));
        assertEquals("Prof. Novo", reg.depois().get("professor"));
        assertEquals("Sala 212", reg.antes().get("sala"));
        assertEquals("Lab. 1", reg.depois().get("sala"));
        assertEquals("SEX 14:00–16:00", reg.antes().get("horarios"));
        assertEquals("SEX 16:00–18:00", reg.depois().get("horarios"));
        assertEquals("Coordenação", reg.autor().nome());
    }

    @Test
    @DisplayName("sala fora do catálogo do curso é recusada")
    void salaForaDoCatalogo() {
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class, () -> servico.editar(existente.id(),
                new DadosDeAjuste("Prof. Rodrigo", "Sala 999", 40, existente.horarios(), null), "Motivo suficiente aqui", autor));
        assertEquals("sala_fora_do_catalogo", e.codigo());
    }

    @Test
    @DisplayName("edição sem mudança real é recusada (não polui o histórico)")
    void semAlteracoes() {
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class, () -> servico.editar(existente.id(),
                new DadosDeAjuste("Prof. Rodrigo", "Sala 212", 40, existente.horarios(), null), "Motivo suficiente aqui", autor));
        assertEquals("sem_alteracoes", e.codigo());
    }

    @Test
    @DisplayName("versão desatualizada (edição concorrente) gera conflito")
    void versaoDesatualizada() {
        servico.editar(existente.id(), new DadosDeAjuste("Prof. A", "Sala 212", 40, existente.horarios(), 0), "Primeira edição válida", autor);
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class, () -> servico.editar(existente.id(),
                new DadosDeAjuste("Prof. B", "Sala 212", 40, existente.horarios(), 0), "Segunda edição com versão velha", autor));
        assertEquals("turma_alterada_por_outro", e.codigo());
    }

    @Test
    @DisplayName("sala ocupada por outro docente no mesmo horário vira aviso, não bloqueio")
    void avisoDeSala() {
        turmas.salvar(new Turma(null, "bsi", new DisciplinaDaMatriz(2023, "OUTRA", null, "Outra disciplina", "2", false), null,
                "Prof. Marcelo", "Lab. 1", 30, Secao.REGULAR, null, Origem.LEGADO, 0, List.of(HorarioDeAula.deHoras(5, 15, 17))));
        var r = servico.editar(existente.id(), new DadosDeAjuste("Prof. Rodrigo", "Lab. 1", 40, existente.horarios(), null),
                "Troca de sala por obra", autor);
        assertEquals(1, r.avisos().size());
        assertTrue(r.avisos().get(0).contains("OUTRA"));
    }

    @Test
    @DisplayName("nova turma excepcional: exige horário, grava origem 'excepcional' e audita a criação")
    void criaTurma() {
        assertThrows(ErroDeNegocio.class, () -> servico.criar("bsi",
                new DadosDeNovaTurma("NOVA", "Nova disciplina", "", "3", "Prof. Z", "Lab. 1", 20, List.of()), "Motivo suficiente aqui", autor));
        var r = servico.criar("bsi", new DadosDeNovaTurma("NOVA", "Nova disciplina", "", "3", "Prof. Z", "Lab. 1", 20,
                List.of(HorarioDeAula.deHoras(1, 18, 20))), "Turma extra aprovada pelo colegiado", autor);
        assertEquals(Origem.EXCEPCIONAL, r.turma().origem());
        assertEquals(TipoDeAlteracao.EXCEPCIONAL_CRIACAO, auditoria.registros.get(0).tipo());
        assertEquals("NOVA", auditoria.registros.get(0).turmaSigla());
    }

    @Test
    @DisplayName("exclusão exige motivo, esconde a turma e audita com o resumo anterior")
    void excluiTurma() {
        assertThrows(ErroDeNegocio.class, () -> servico.excluir(existente.id(), "x", autor));
        servico.excluir(existente.id(), "Turma cancelada pelo colegiado", autor);
        assertFalse(turmas.buscar(existente.id()).isPresent());
        assertEquals(TipoDeAlteracao.EXCEPCIONAL_EXCLUSAO, auditoria.registros.get(0).tipo());
        assertEquals("Prof. Rodrigo", auditoria.registros.get(0).antes().get("professor"));
    }
}
