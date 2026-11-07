package br.unirio.painel.importacao.dominio;

import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.compartilhado.Textos;
import br.unirio.painel.importacao.dominio.LinhaAnalisada.Situacao;
import br.unirio.painel.oferta.dominio.DisciplinaDaMatriz;
import java.util.ArrayList;
import java.util.List;

/**
 * Regra da planilha: cada linha precisa de Sigla + Disciplina de pelo menos uma das grades (antiga/atual).
 * O formato (dual ou simples) é reconhecido pelo cabeçalho; colunas desconhecidas são ignoradas.
 */
public final class AnalisadorDeCsv {

    public record Analise(boolean dual, List<LinhaAnalisada> linhas, List<String> colunasIgnoradas) { }

    private AnalisadorDeCsv() { }

    public static Analise analisar(List<List<String>> linhas, int duracaoPadraoHoras, int linhasMaximas) {
        if (linhas.isEmpty()) {
            throw ErroDeNegocio.invalido("csv_vazio", "Arquivo vazio ou ilegível.");
        }
        if (linhas.size() - 1 > linhasMaximas) {
            throw ErroDeNegocio.invalido("csv_grande_demais", "O arquivo tem mais de " + linhasMaximas + " linhas.");
        }
        CabecalhoCsv cab = CabecalhoCsv.de(linhas.get(0));
        boolean reconhece = cab.dual() || cab.tem("sigla") || cab.tem("nome");
        if (!reconhece) {
            throw ErroDeNegocio.invalido("csv_cabecalho_nao_reconhecido",
                    "Não encontrei as colunas de Sigla e Disciplina no cabeçalho. Baixe o modelo (.csv) e use os mesmos nomes de coluna.");
        }
        if (linhas.size() < 2) {
            throw ErroDeNegocio.invalido("csv_sem_linhas", "O arquivo só tem o cabeçalho: inclua ao menos uma linha de turma.");
        }
        // Linhas repetidas (mesma turma duas vezes) são detectadas no serviço, que sabe qual turma real cada linha atinge.
        List<LinhaAnalisada> saida = new ArrayList<>();
        for (int i = 1; i < linhas.size(); i++) {
            saida.add(analisarLinha(linhas.get(i), i + 1, cab, duracaoPadraoHoras));
        }
        return new Analise(cab.dual(), saida, cab.ignoradas());
    }

    static LinhaAnalisada analisarLinha(List<String> cols, int numero, CabecalhoCsv cab, int duracao) {
        InterpretadorDeHorario.Resultado h = InterpretadorDeHorario.interpretar(
                cab.colunasDeHorario().stream().map(i -> i < cols.size() ? cols.get(i) : "").toList(), duracao);
        String aviso = h.invalidos().isEmpty() ? null : "Horário não reconhecido: \"" + String.join("\", \"", h.invalidos()) + "\"";

        Long id = null;
        String idTexto = cab.valor(cols, "id");
        if (!idTexto.isEmpty()) {
            try { id = Long.parseLong(idTexto); } catch (NumberFormatException e) {
                aviso = juntar(aviso, "Coluna id ignorada (não é número): " + idTexto);
            }
        }
        Integer vagas = null;
        String vagasTexto = cab.valor(cols, "vagas");
        if (!vagasTexto.isEmpty()) {
            try {
                int v = Integer.parseInt(vagasTexto);
                if (v < 0 || v > 1000) return erro(numero, "Vagas fora do intervalo permitido (0 a 1000): " + vagasTexto);
                vagas = v;
            } catch (NumberFormatException e) {
                aviso = juntar(aviso, "Vagas ignoradas (não é número): " + vagasTexto);
            }
        }
        String secao = cab.tem("secao") ? ("pos".equals(Textos.normalizar(cab.valor(cols, "secao"))) ? "pos" : "regular") : null;
        String professor = vazioParaNulo(cab.valor(cols, "professor"));
        String sala = vazioParaNulo(cab.valor(cols, "sala"));

        try {
            if (cab.dual()) {
                String sa = cab.valor(cols, "siglaAntiga"), na = cab.valor(cols, "nomeAntiga");
                String su = cab.valor(cols, "siglaAtual"), nu = cab.valor(cols, "nomeAtual");
                boolean antiga = !sa.isEmpty() && !na.isEmpty();
                boolean atual = !su.isEmpty() && !nu.isEmpty();
                if (!antiga && !atual) {
                    if (!sa.isEmpty() || !na.isEmpty() || !su.isEmpty() || !nu.isEmpty()) {
                        return erro(numero, "Sigla e Disciplina devem vir juntas em pelo menos uma das grades");
                    }
                    return erro(numero, "Sigla e Disciplina não informadas");
                }
                DisciplinaDaMatriz d08 = antiga ? new DisciplinaDaMatriz(2008, sa, cab.valor(cols, "codigoAntiga"), na, cab.valor(cols, "periodoAntiga"), false) : null;
                DisciplinaDaMatriz d23 = atual ? new DisciplinaDaMatriz(2023, su, cab.valor(cols, "codigoAtual"), nu, cab.valor(cols, "periodoAtual"), false) : null;
                RegistroImportado r = new RegistroImportado(atual ? su : sa, atual ? 2023 : 2008, d08, d23, professor, sala, vagas, secao, h.horarios(), id);
                return new LinhaAnalisada(numero, aviso == null ? Situacao.OK : Situacao.AVISO, aviso, r);
            }
            String sigla = cab.valor(cols, "sigla"), nome = cab.valor(cols, "nome");
            if (sigla.isEmpty() || nome.isEmpty()) return erro(numero, "Sigla e Disciplina não informadas");
            int matriz = "2008".equals(Textos.normalizar(cab.valor(cols, "grade"))) ? 2008 : 2023;
            DisciplinaDaMatriz d = new DisciplinaDaMatriz(matriz, sigla, cab.valor(cols, "codigo"), nome, cab.valor(cols, "periodo"), false);
            RegistroImportado r = new RegistroImportado(sigla, matriz, matriz == 2008 ? d : null, matriz == 2023 ? d : null,
                    professor, sala, vagas, secao, h.horarios(), id);
            return new LinhaAnalisada(numero, aviso == null ? Situacao.OK : Situacao.AVISO, aviso, r);
        } catch (ErroDeNegocio e) {
            return erro(numero, e.getMessage());
        }
    }

    private static LinhaAnalisada erro(int numero, String msg) {
        return new LinhaAnalisada(numero, Situacao.ERRO, msg, null);
    }

    private static String juntar(String a, String b) {
        return a == null || a.isEmpty() ? b : a + " · " + b;
    }

    private static String vazioParaNulo(String s) {
        return s == null || s.isEmpty() ? null : s;
    }
}
