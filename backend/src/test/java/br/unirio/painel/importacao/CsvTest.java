package br.unirio.painel.importacao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.importacao.dominio.AnalisadorDeCsv;
import br.unirio.painel.importacao.dominio.InterpretadorDeHorario;
import br.unirio.painel.importacao.dominio.LeitorDeCsv;
import br.unirio.painel.importacao.dominio.LinhaAnalisada;
import br.unirio.painel.importacao.dominio.LinhaAnalisada.Situacao;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CsvTest {

    static final String MODELO = "SiglaAntiga,DisciplinaAntiga,CodigoAntiga,PeriodoAntiga,SiglaAtual,DisciplinaAtual,CodigoAtual,PeriodoAtual,Professor,Horario1,Horario2,Sala,Vagas\n"
            + ",,,,ALGPROG/I,Algoritmos e Programação (ingressantes),TIN0222,1,Prof. Jefferson,3ª 14h,5ª 14h,Lab. 3,36\n"
            + "TP1,Técnicas de Programação I,TIN0107,1,ALGPROG/V,Algoritmos e Programação (veteranos),TIN0222,1,Prof. Reinaldo,3ª 14h,5ª 14h,Lab. SAN,30\n";

    @Test
    @DisplayName("o modelo oficial é lido: formato duplo, duas linhas ok e horários de 2h (padrão do BSI)")
    void modeloOficial() {
        var analise = AnalisadorDeCsv.analisar(LeitorDeCsv.ler(MODELO), 2, 2000);
        assertTrue(analise.dual());
        assertEquals(2, analise.linhas().size());
        LinhaAnalisada l1 = analise.linhas().get(0);
        assertEquals(Situacao.OK, l1.situacao());
        assertNull(l1.registro().disciplina2008());
        assertEquals("ALGPROG/I", l1.registro().disciplina2023().sigla());
        assertEquals(List.of(HorarioDeAula.deHoras(2, 14, 16), HorarioDeAula.deHoras(4, 14, 16)), l1.registro().horarios());
        assertEquals(36, l1.registro().vagas());
        assertNotNull(analise.linhas().get(1).registro().disciplina2008());
    }

    @Test
    @DisplayName("aceita ponto e vírgula, aspas, CRLF e acentos nos cabeçalhos")
    void delimitadorEAspas() {
        String csv = "Sigla;Disciplina;Professor;Horário\r\nCAL1;\"Cálculo; I\";\"Prof. \"\"Ana\"\"\";2ª 18h\r\n";
        var linhas = LeitorDeCsv.ler(csv);
        assertEquals("Cálculo; I", linhas.get(1).get(1));
        assertEquals("Prof. \"Ana\"", linhas.get(1).get(2));
        var analise = AnalisadorDeCsv.analisar(linhas, 1, 100);
        assertTrue(!analise.dual());
        assertEquals(HorarioDeAula.deHoras(1, 18, 19), analise.linhas().get(0).registro().horarios().get(0));
    }

    @Test
    @DisplayName("linha sem sigla/disciplina vira erro; metade de um par também; linha totalmente vazia é descartada")
    void camposObrigatorios() {
        String csv = "SiglaAntiga,DisciplinaAntiga,SiglaAtual,DisciplinaAtual,Professor\n,,,\nTP1,,,\n,,,,Prof. X\n,,FSI,Fundamentos\n";
        var linhas = AnalisadorDeCsv.analisar(LeitorDeCsv.ler(csv), 2, 100).linhas();
        assertEquals(3, linhas.size());
        assertEquals(Situacao.ERRO, linhas.get(0).situacao());
        assertEquals("Sigla e Disciplina devem vir juntas em pelo menos uma das grades", linhas.get(0).mensagem());
        assertEquals(Situacao.ERRO, linhas.get(1).situacao());
        assertEquals("Sigla e Disciplina não informadas", linhas.get(1).mensagem());
        assertEquals(Situacao.OK, linhas.get(2).situacao());
    }

    @Test
    @DisplayName("horário ilegível gera aviso e a linha continua aplicável")
    void horarioInvalidoEhAviso() {
        String csv = "Sigla,Disciplina,Horario1\nA,Alfa,quando der\n";
        LinhaAnalisada l = AnalisadorDeCsv.analisar(LeitorDeCsv.ler(csv), 2, 100).linhas().get(0);
        assertEquals(Situacao.AVISO, l.situacao());
        assertTrue(l.mensagem().contains("quando der"));
        assertTrue(l.aplicavel());
    }

    @Test
    @DisplayName("cabeçalho sem Sigla/Disciplina é rejeitado com orientação")
    void cabecalhoDesconhecido() {
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class,
                () -> AnalisadorDeCsv.analisar(LeitorDeCsv.ler("a,b,c\n1,2,3\n"), 2, 100));
        assertEquals("csv_cabecalho_nao_reconhecido", e.codigo());
    }

    @Test
    @DisplayName("limite de linhas é respeitado")
    void limiteDeLinhas() {
        StringBuilder sb = new StringBuilder("Sigla,Disciplina\n");
        for (int i = 0; i < 5; i++) sb.append("S").append(i).append(",D").append(i).append("\n");
        assertThrows(ErroDeNegocio.class, () -> AnalisadorDeCsv.analisar(LeitorDeCsv.ler(sb.toString()), 1, 3));
    }

    @Test
    @DisplayName("Excel: linha 'sep=;', linhas ';;;' vazias e tabulação são entendidas")
    void formatosDoExcel() {
        var comSep = LeitorDeCsv.ler("sep=;\nSigla;Disciplina\nA;Alfa\n;;\n;\n");
        assertEquals(List.of(List.of("Sigla", "Disciplina"), List.of("A", "Alfa")), comSep);
        var tab = LeitorDeCsv.ler("Sigla\tDisciplina\tSala\nA\tAlfa, a primeira\tLab 1\n");
        assertEquals("Alfa, a primeira", tab.get(1).get(1));
    }

    @Test
    @DisplayName("arquivo só com cabeçalho é recusado; colunas com nome desconhecido são listadas")
    void cabecalhoSemDadosEColunasIgnoradas() {
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class,
                () -> AnalisadorDeCsv.analisar(LeitorDeCsv.ler("Sigla,Disciplina\n,,\n"), 1, 100));
        assertEquals("csv_sem_linhas", e.codigo());
        var analise = AnalisadorDeCsv.analisar(LeitorDeCsv.ler("Sigla,Disciplina,Profesor,Obs\nA,Alfa,X,Y\n"), 1, 100);
        assertEquals(List.of("Profesor", "Obs"), analise.colunasIgnoradas());
    }

    @Test
    @DisplayName("vagas fora do intervalo é erro; vagas não numéricas é aviso")
    void vagas() {
        var linhas = AnalisadorDeCsv.analisar(LeitorDeCsv.ler("Sigla,Disciplina,Vagas\nA,Alfa,5000\nB,Beta,muitas\nC,Gama,\n"), 1, 100).linhas();
        assertEquals(Situacao.ERRO, linhas.get(0).situacao());
        assertEquals(Situacao.AVISO, linhas.get(1).situacao());
        assertNull(linhas.get(1).registro().vagas());
        assertEquals(Situacao.OK, linhas.get(2).situacao());
    }

    @Test
    @DisplayName("interpreta formatos de horário: ordinal, número, nome, hh:mm, intervalo e várias células")
    void formatosDeHorario() {
        var r = InterpretadorDeHorario.interpretar(List.of("3ª 14h", "2ª 18:00 | qua 8h", "5ª 14h-16h30", "6 10h às 12h", "sab 9"), 2);
        assertTrue(r.invalidos().isEmpty());
        assertEquals(new HorarioDeAula(2, LocalTime.of(14, 0), LocalTime.of(16, 0)), r.horarios().get(0));
        assertEquals(new HorarioDeAula(1, LocalTime.of(18, 0), LocalTime.of(20, 0)), r.horarios().get(1));
        assertEquals(new HorarioDeAula(3, LocalTime.of(8, 0), LocalTime.of(10, 0)), r.horarios().get(2));
        assertEquals(new HorarioDeAula(4, LocalTime.of(14, 0), LocalTime.of(16, 30)), r.horarios().get(3));
        assertEquals(new HorarioDeAula(6, LocalTime.of(10, 0), LocalTime.of(12, 0)), r.horarios().get(4)); // número solto 1–6 = dia direto (6 = sábado)
        assertEquals(new HorarioDeAula(6, LocalTime.of(9, 0), LocalTime.of(11, 0)), r.horarios().get(5));
    }

    @Test
    @DisplayName("rejeita horário inválido: hora 25, dia 8ª, fim antes do início e passagem da meia-noite")
    void horariosInvalidos() {
        var r = InterpretadorDeHorario.interpretar(List.of("3ª 25h", "8ª 10h", "3ª 16h-14h", "3ª 23h", "xx"), 2);
        assertEquals(5, r.invalidos().size());
        assertTrue(r.horarios().isEmpty());
    }

    @Test
    @DisplayName("decodifica UTF-8 com BOM e cai para Windows-1252 quando há bytes inválidos")
    void codificacao() {
        byte[] utf8Bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF, 'a', (byte) 0xC3, (byte) 0xA7};
        assertEquals("aç", LeitorDeCsv.decodificar(utf8Bom));
        byte[] win = "Cálculo".getBytes(Charset.forName("windows-1252"));
        assertEquals("Cálculo", LeitorDeCsv.decodificar(win));
        assertEquals("Cálculo", LeitorDeCsv.decodificar("Cálculo".getBytes(StandardCharsets.UTF_8)));
    }
}
