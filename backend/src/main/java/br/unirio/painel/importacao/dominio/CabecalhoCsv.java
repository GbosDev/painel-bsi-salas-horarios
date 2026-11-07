package br.unirio.painel.importacao.dominio;

import br.unirio.painel.compartilhado.Textos;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Identifica o formato da planilha pelo cabeçalho: duas grades lado a lado ("dual") ou uma só ("simples").
 * Colunas desconhecidas são ignoradas.
 */
public final class CabecalhoCsv {

    private static final Map<String, List<String>> DUAL = new LinkedHashMap<>();
    private static final Map<String, List<String>> SIMPLES = new LinkedHashMap<>();
    private static final Map<String, List<String>> COMPARTILHADOS = new LinkedHashMap<>();
    private static final List<String> HORARIO = List.of("horario", "horarios", "sessao", "sessoes");

    static {
        DUAL.put("siglaAntiga", List.of("siglaantiga", "sigla2008", "siglagradeantiga"));
        DUAL.put("nomeAntiga", List.of("disciplinaantiga", "nomeantiga", "disciplina2008", "nome2008"));
        DUAL.put("codigoAntiga", List.of("codigoantiga", "cod2008", "codigo2008"));
        DUAL.put("periodoAntiga", List.of("periodoantiga", "periodo2008"));
        DUAL.put("siglaAtual", List.of("siglaatual", "sigla2023", "siglanova", "siglagradenova", "siglagradeatual"));
        DUAL.put("nomeAtual", List.of("disciplinaatual", "nomeatual", "disciplina2023", "nome2023", "disciplinanova", "nomenova"));
        DUAL.put("codigoAtual", List.of("codigoatual", "cod2023", "codigo2023"));
        DUAL.put("periodoAtual", List.of("periodoatual", "periodo2023"));
        SIMPLES.put("sigla", List.of("sigla"));
        SIMPLES.put("nome", List.of("disciplina", "nome"));
        SIMPLES.put("codigo", List.of("codigo", "cod"));
        SIMPLES.put("periodo", List.of("periodo"));
        SIMPLES.put("grade", List.of("grade", "curriculo"));
        COMPARTILHADOS.put("professor", List.of("professor", "docente", "professora"));
        COMPARTILHADOS.put("sala", List.of("sala", "ambiente", "espaco"));
        COMPARTILHADOS.put("vagas", List.of("vagas", "capacidade"));
        COMPARTILHADOS.put("secao", List.of("secao", "tipo"));
        COMPARTILHADOS.put("id", List.of("id"));
    }

    private final Map<String, Integer> indices;
    private final List<Integer> colunasDeHorario;
    private final boolean dual;
    private final List<String> ignoradas;

    private CabecalhoCsv(Map<String, Integer> indices, List<Integer> colunasDeHorario, boolean dual, List<String> ignoradas) {
        this.indices = indices;
        this.colunasDeHorario = colunasDeHorario;
        this.dual = dual;
        this.ignoradas = ignoradas;
    }

    public static CabecalhoCsv de(List<String> linhaDeCabecalho) {
        Map<String, Integer> mapa = new HashMap<>();
        List<Integer> horarios = new ArrayList<>();
        List<String> ignoradas = new ArrayList<>();
        List<Map<String, List<String>>> grupos = List.of(DUAL, SIMPLES, COMPARTILHADOS);
        for (int idx = 0; idx < linhaDeCabecalho.size(); idx++) {
            String norm = Textos.normalizar(linhaDeCabecalho.get(idx)).replace(" ", "");
            boolean casou = false;
            for (Map<String, List<String>> grupo : grupos) {
                for (Map.Entry<String, List<String>> e : grupo.entrySet()) {
                    if (casou || mapa.containsKey(e.getKey())) continue;
                    if (e.getValue().contains(norm)) { mapa.put(e.getKey(), idx); casou = true; }
                }
            }
            if (!casou) {
                boolean ehHorario = HORARIO.stream().anyMatch(a -> norm.startsWith(a) && norm.length() <= a.length() + 2);
                boolean continua = norm.isEmpty() && !horarios.isEmpty() && idx == horarios.get(horarios.size() - 1) + 1;
                if (ehHorario || continua) horarios.add(idx);
                else if (!norm.isEmpty()) ignoradas.add(Textos.limpar(linhaDeCabecalho.get(idx)));
            }
        }
        boolean dual = DUAL.keySet().stream().anyMatch(mapa::containsKey);
        return new CabecalhoCsv(mapa, horarios, dual, ignoradas);
    }

    public boolean dual() { return dual; }

    /** Colunas do cabeçalho com nome não reconhecido: o conteúdo delas é ignorado (a prévia avisa). */
    public List<String> ignoradas() { return ignoradas; }

    public List<Integer> colunasDeHorario() { return colunasDeHorario; }

    public boolean tem(String campo) { return indices.containsKey(campo); }

    public String valor(List<String> colunas, String campo) {
        Integer i = indices.get(campo);
        if (i == null || i >= colunas.size()) return "";
        String v = colunas.get(i);
        return v == null ? "" : br.unirio.painel.compartilhado.Textos.limpar(v);
    }
}
