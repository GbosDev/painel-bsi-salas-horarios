package br.unirio.painel.importacao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.unirio.painel.apoio.FakesEmMemoria;
import br.unirio.painel.auditoria.dominio.Autor;
import br.unirio.painel.auditoria.dominio.TipoDeAlteracao;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.importacao.aplicacao.ServicoDeImportacaoCsv;
import br.unirio.painel.importacao.aplicacao.ServicoDeImportacaoCsv.LimitesDeImportacao;
import br.unirio.painel.importacao.dominio.LinhaAnalisada.Situacao;
import br.unirio.painel.oferta.dominio.DisciplinaDaMatriz;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import br.unirio.painel.oferta.dominio.Origem;
import br.unirio.painel.oferta.dominio.Secao;
import br.unirio.painel.oferta.dominio.Turma;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ServicoDeImportacaoCsvTest {

    final FakesEmMemoria.Catalogo catalogo = new FakesEmMemoria.Catalogo();
    final FakesEmMemoria.Turmas turmas = new FakesEmMemoria.Turmas();
    final FakesEmMemoria.Lotes lotes = new FakesEmMemoria.Lotes();
    final FakesEmMemoria.Auditoria auditoria = new FakesEmMemoria.Auditoria();
    final ServicoDeImportacaoCsv servico;
    final Autor autor = new Autor(1L, "Coordenação", "PROFESSOR");

    ServicoDeImportacaoCsvTest() {
        catalogo.turmas = turmas;
        servico = new ServicoDeImportacaoCsv(catalogo, turmas, lotes, auditoria, FakesEmMemoria.relogioFixo(),
                new LimitesDeImportacao(1_048_576, 2000));
    }

    static byte[] csv(String s) { return s.getBytes(StandardCharsets.UTF_8); }

    static final String BASE = "Sigla,Disciplina,Professor,Horario1,Sala,Vagas\n"
            + "ALG,Algoritmos,Prof. Jefferson,3ª 14h,Lab. 1,36\n";

    @Test
    @DisplayName("a prévia não grava turmas; só registra o lote")
    void previaNaoGravaTurmas() {
        var previa = servico.gerarPrevia("bsi", "turmas.csv", csv(BASE), autor);
        assertEquals(1, previa.totalOk());
        assertTrue(turmas.porId.isEmpty());
        assertTrue(auditoria.registros.isEmpty());
    }

    @Test
    @DisplayName("aplicar cria a turma, audita 'csv_criada' e marca o lote como aplicado")
    void aplicaCriacao() {
        var previa = servico.gerarPrevia("bsi", "turmas.csv", csv(BASE), autor);
        var r = servico.aplicar(previa.loteId(), "Lote do semestre", autor);
        assertEquals(1, r.criadas());
        Turma t = turmas.listarDoCurso("bsi").get(0);
        assertEquals("Prof. Jefferson", t.professor());
        assertEquals("TER 14:00–16:00", t.horarios().get(0).rotulo());
        assertEquals(TipoDeAlteracao.CSV_CRIADA, auditoria.registros.get(0).tipo());
        assertEquals("Lote do semestre", auditoria.registros.get(0).motivo());
    }

    @Test
    @DisplayName("aplicar o mesmo lote duas vezes é recusado")
    void naoAplicaDuasVezes() {
        var previa = servico.gerarPrevia("bsi", "turmas.csv", csv(BASE), autor);
        servico.aplicar(previa.loteId(), null, autor);
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class, () -> servico.aplicar(previa.loteId(), null, autor));
        assertEquals("lote_ja_aplicado", e.codigo());
        assertEquals(1, turmas.listarDoCurso("bsi").size());
    }

    @Test
    @DisplayName("reenviar o mesmo arquivo: prévia avisa e a nova aplicação não altera nada")
    void reenvioEhIdempotente() {
        servico.aplicar(servico.gerarPrevia("bsi", "turmas.csv", csv(BASE), autor).loteId(), null, autor);
        int registrosAntes = auditoria.registros.size();
        var segunda = servico.gerarPrevia("bsi", "turmas.csv", csv(BASE), autor);
        assertTrue(segunda.avisoGeral() != null && segunda.avisoGeral().contains("já foi aplicado"));
        var r = servico.aplicar(segunda.loteId(), null, autor);
        assertEquals(0, r.criadas());
        assertEquals(0, r.atualizadas());
        assertEquals(1, r.semAlteracao());
        assertEquals(registrosAntes, auditoria.registros.size());
        assertEquals(1, turmas.listarDoCurso("bsi").size());
    }

    @Test
    @DisplayName("atualiza turma existente por sigla; células vazias não apagam dados")
    void atualizaSemApagar() {
        servico.aplicar(servico.gerarPrevia("bsi", "a.csv", csv(BASE), autor).loteId(), null, autor);
        String atualiza = "Sigla,Disciplina,Professor,Horario1,Sala,Vagas\nalg,Algoritmos,,,,40\n";
        var r = servico.aplicar(servico.gerarPrevia("bsi", "b.csv", csv(atualiza), autor).loteId(), "Ajuste de vagas", autor);
        assertEquals(1, r.atualizadas());
        Turma t = turmas.listarDoCurso("bsi").get(0);
        assertEquals(40, t.vagas());
        assertEquals("Prof. Jefferson", t.professor());
        assertEquals("Lab. 1", t.sala());
        assertEquals(1, t.horarios().size());
        var ultimo = auditoria.registros.get(auditoria.registros.size() - 1);
        assertEquals(TipoDeAlteracao.CSV_ATUALIZADA, ultimo.tipo());
        assertEquals(36, ultimo.antes().get("vagas"));
        assertEquals(40, ultimo.depois().get("vagas"));
    }

    @Test
    @DisplayName("linhas com erro não são aplicadas; as válidas são")
    void aplicaSoValidas() {
        String misto = "Sigla,Disciplina\nOK1,Boa\n,Sem sigla\n";
        var previa = servico.gerarPrevia("bsi", "m.csv", csv(misto), autor);
        assertEquals(1, previa.totalOk());
        assertEquals(1, previa.totalErro());
        var r = servico.aplicar(previa.loteId(), null, autor);
        assertEquals(1, r.criadas());
    }

    @Test
    @DisplayName("sala nova no CSV avisa na prévia e entra no catálogo ao aplicar, com auditoria")
    void salaNovaEntraNoCatalogo() {
        String csv = "Sigla,Disciplina,Sala\nX,Xis,Sala 301\n";
        var previa = servico.gerarPrevia("bsi", "s.csv", csv(csv), autor);
        assertTrue(previa.linhas().get(0).mensagem().contains("será adicionada"));
        var r = servico.aplicar(previa.loteId(), null, autor);
        assertEquals(1, r.salasCriadas());
        assertTrue(catalogo.salaExisteNoCurso("bsi", "Sala 301"));
        assertTrue(auditoria.registros.stream().anyMatch(a -> a.tipo() == TipoDeAlteracao.SALA_ADICIONADA));
    }

    @Test
    @DisplayName("recusa arquivo vazio, extensão errada e arquivo grande demais")
    void validacoesDeArquivo() {
        assertThrows(ErroDeNegocio.class, () -> servico.gerarPrevia("bsi", "a.csv", new byte[0], autor));
        assertThrows(ErroDeNegocio.class, () -> servico.gerarPrevia("bsi", "a.xlsx", csv(BASE), autor));
        var pequeno = new ServicoDeImportacaoCsv(catalogo, turmas, lotes, auditoria, FakesEmMemoria.relogioFixo(), new LimitesDeImportacao(10, 10));
        assertThrows(ErroDeNegocio.class, () -> pequeno.gerarPrevia("bsi", "a.csv", csv(BASE), autor));
        assertThrows(ErroDeNegocio.class, () -> servico.gerarPrevia("curso-inexistente", "a.csv", csv(BASE), autor));
    }

    @Test
    @DisplayName("valores que parecem fórmula de planilha ficam como texto (nada é executado)")
    void textoDeFormulaFicaComoTexto() {
        var previa = servico.gerarPrevia("bsi", "f.csv", csv("Sigla,Disciplina\n=CMD(),=1+1\n"), autor);
        servico.aplicar(previa.loteId(), null, autor);
        assertFalse(turmas.listarDoCurso("bsi").isEmpty());
        assertEquals("=1+1", turmas.listarDoCurso("bsi").get(0).disciplinaPrincipal().nome());
    }

    // ---------- revisão da importação: prévia = exatamente o que a aplicação faz ----------

    private Turma turma(Integer matriz, String sigla, String sala, String professor, int dia, int ini, int fim) {
        var d = new DisciplinaDaMatriz(matriz, sigla, "", "Disciplina " + sigla, "1", false);
        return turmas.salvar(new Turma(null, "bsi", matriz == 2023 ? d : null, matriz == 2008 ? d : null, professor, sala, 30,
                Secao.REGULAR, null, Origem.CSV, 0, List.of(HorarioDeAula.deHoras(dia, ini, fim))));
    }

    private static String acao(ServicoDeImportacaoCsv.Previa p, int numeroDaLinha) {
        var a = p.acoes().get(numeroDaLinha);
        return a == null ? null : a.codigo();
    }

    @Test
    @DisplayName("a prévia diz o que cada linha fará: criar, atualizar ou nada")
    void previaMostraAcoes() {
        servico.aplicar(servico.gerarPrevia("bsi", "a.csv", csv(BASE), autor).loteId(), null, autor);
        String csv = "Sigla,Disciplina,Professor,Horario1,Sala,Vagas\n"
                + "ALG,Algoritmos,Prof. Jefferson,3ª 14h,Lab. 1,36\n"     // igual ao banco
                + "ALG2,Algoritmos II,Prof. Ana,4ª 8h,Lab. 1,30\n";       // nova
        var p = servico.gerarPrevia("bsi", "b.csv", csv(csv), autor);
        assertEquals("sem_alteracao", acao(p, 2));
        assertEquals("criar", acao(p, 3));
        assertEquals(1, p.totalCriar());
        assertEquals(1, p.totalSemAlteracao());
        var p2 = servico.gerarPrevia("bsi", "c.csv", csv("Sigla,Disciplina,Vagas\nALG,Algoritmos,50\n"), autor);
        assertEquals("atualizar", acao(p2, 2));
    }

    @Test
    @DisplayName("sigla em mais de uma turma do curso: erro na prévia pedindo a coluna Id; com Id funciona")
    void siglaAmbiguaExigeId() {
        Turma t1 = turma(2023, "ALG", "Lab. 1", "Prof. A", 1, 8, 10);
        turma(2023, "ALG", "Lab. 2", "Prof. B", 2, 8, 10);
        var p = servico.gerarPrevia("bsi", "a.csv", csv("Sigla,Disciplina,Vagas\nALG,Algoritmos,40\n"), autor);
        assertEquals(1, p.totalErro());
        assertTrue(p.linhas().get(0).mensagem().contains("coluna Id"));
        var comId = servico.gerarPrevia("bsi", "b.csv", csv("Id,Sigla,Disciplina,Vagas\n" + t1.id() + ",ALG,Algoritmos,40\n"), autor);
        assertEquals("atualizar", acao(comId, 2));
        servico.aplicar(comId.loteId(), null, autor);
        assertEquals(40, turmas.buscar(t1.id()).orElseThrow().vagas());
    }

    @Test
    @DisplayName("a mesma turma duas vezes no arquivo: a segunda linha é erro (não sobrescreve a primeira em silêncio)")
    void linhaRepetidaNoArquivo() {
        var p = servico.gerarPrevia("bsi", "a.csv", csv("Sigla,Disciplina,Vagas\nA,Alfa,10\na,Alfa,20\n"), autor);
        assertEquals("criar", acao(p, 2));
        assertEquals(Situacao.ERRO, p.linhas().get(1).situacao());
        assertTrue(p.linhas().get(1).mensagem().contains("linha 2"));
    }

    @Test
    @DisplayName("linha com as duas grades encontra a turma que só tinha a grade antiga (não duplica)")
    void encontraPelaGradeAntiga() {
        Turma antiga = turma(2008, "TP1", "Lab. 1", "Prof. A", 1, 8, 10);
        String csv = "SiglaAntiga,DisciplinaAntiga,SiglaAtual,DisciplinaAtual\nTP1,Técnicas I,PROG1,Programação I\n";
        var p = servico.gerarPrevia("bsi", "a.csv", csv(csv), autor);
        assertEquals("atualizar", acao(p, 2));
        servico.aplicar(p.loteId(), null, autor);
        assertEquals(1, turmas.listarDoCurso("bsi").size());
        assertEquals("PROG1", turmas.buscar(antiga.id()).orElseThrow().disciplina2023().sigla());
    }

    @Test
    @DisplayName("conflito de sala (outro docente, horário que se cruza) aparece como aviso na prévia")
    void conflitoDeSalaNaPrevia() {
        turma(2023, "EXIST", "Lab. 1", "Prof. A", 2, 14, 16);
        var p = servico.gerarPrevia("bsi", "a.csv", csv("Sigla,Disciplina,Professor,Horario1,Sala\nN,Nova,Prof. B,3ª 15h,Lab. 1\n"), autor);
        assertEquals(Situacao.AVISO, p.linhas().get(0).situacao());
        assertTrue(p.linhas().get(0).mensagem().contains("Conflito de sala"));
    }

    @Test
    @DisplayName("horários que se cruzam na mesma linha são erro já na prévia (a aplicação não falha no meio)")
    void erroDeValidacaoNaPrevia() {
        var p = servico.gerarPrevia("bsi", "a.csv",
                csv("Sigla,Disciplina,Horario1,Horario2\nA,Alfa,2ª 8h-10h,2ª 9h-11h\nB,Beta,3ª 8h,\n"), autor);
        assertEquals(Situacao.ERRO, p.linhas().get(0).situacao());
        var r = servico.aplicar(p.loteId(), null, autor);
        assertEquals(1, r.criadas());
    }

    @Test
    @DisplayName("se as turmas mudaram desde a prévia, a aplicação recusa e nada é gravado")
    void previaDesatualizada() {
        turma(2023, "ALG", "Lab. 1", "Prof. A", 1, 8, 10);
        var p = servico.gerarPrevia("bsi", "a.csv", csv("Sigla,Disciplina,Vagas\nALG,Algoritmos,40\nN,Nova,10\n"), autor);
        turma(2023, "ALG", "Lab. 2", "Prof. B", 2, 8, 10); // alguém criou outra ALG depois da prévia
        int antes = turmas.listarDoCurso("bsi").size();
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class, () -> servico.aplicar(p.loteId(), null, autor));
        assertEquals("previa_desatualizada", e.codigo());
        assertEquals(antes, turmas.listarDoCurso("bsi").size());
    }
}
