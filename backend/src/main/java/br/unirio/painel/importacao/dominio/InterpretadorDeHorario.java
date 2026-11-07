package br.unirio.painel.importacao.dominio;

import br.unirio.painel.compartilhado.Textos;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Interpreta células de horário da planilha oficial: "3ª 14h", "2ª 18:00", "5ª 14h-16h", "qua 8h às 10h".
 * Vários horários na mesma célula separados por "|". Sem horário final, usa a duração padrão do curso.
 */
public final class InterpretadorDeHorario {

    public record Resultado(List<HorarioDeAula> horarios, List<String> invalidos) { }

    private static final Pattern ORDINAL = Pattern.compile("^(\\d)\\s*[ºª°]");
    private static final Pattern DIA_NUMERO = Pattern.compile("^[1-6]$");
    private static final String HORA = "(\\d{1,2})(?:\\s*h\\s*(\\d{2})?|:(\\d{2}))?";
    private static final Pattern INTERVALO = Pattern.compile("^" + HORA + "\\s*(?:-|–|—|a|as|às)\\s*" + HORA + "$", Pattern.CASE_INSENSITIVE);
    private static final Pattern SIMPLES = Pattern.compile("^" + HORA + "$", Pattern.CASE_INSENSITIVE);
    private static final Map<String, Integer> NOMES = Map.ofEntries(
            Map.entry("seg", 1), Map.entry("segunda", 1), Map.entry("segunda-feira", 1),
            Map.entry("ter", 2), Map.entry("terca", 2), Map.entry("terca-feira", 2),
            Map.entry("qua", 3), Map.entry("quarta", 3), Map.entry("quarta-feira", 3),
            Map.entry("qui", 4), Map.entry("quinta", 4), Map.entry("quinta-feira", 4),
            Map.entry("sex", 5), Map.entry("sexta", 5), Map.entry("sexta-feira", 5),
            Map.entry("sab", 6), Map.entry("sabado", 6));

    private InterpretadorDeHorario() { }

    /** "2ª" = segunda (convenção acadêmica); números 1–6 diretos; nomes do dia. Devolve null se não reconhecer. */
    public static Integer dia(String token) {
        String bruto = token == null ? "" : token.trim().toLowerCase();
        if (bruto.isEmpty()) return null;
        Matcher ord = ORDINAL.matcher(bruto);
        if (ord.find()) {
            int n = Integer.parseInt(ord.group(1));
            return n >= 2 && n <= 7 ? n - 1 : null;
        }
        if (DIA_NUMERO.matcher(bruto).matches()) return Integer.parseInt(bruto);
        return NOMES.get(Textos.normalizar(bruto));
    }

    private static LocalTime hora(String h, String minutoComH, String minutoComDoisPontos) {
        int hh = Integer.parseInt(h);
        String m = minutoComH != null ? minutoComH : minutoComDoisPontos;
        int mm = m == null ? 0 : Integer.parseInt(m);
        if (hh > 23 || mm > 59) return null;
        return LocalTime.of(hh, mm);
    }

    public static Resultado interpretar(List<String> celulas, int duracaoPadraoHoras) {
        List<HorarioDeAula> horarios = new ArrayList<>();
        List<String> invalidos = new ArrayList<>();
        for (String celula : celulas) {
            if (celula == null || celula.isBlank()) continue;
            for (String pedaco : celula.split("\\|")) {
                String chunk = pedaco.trim();
                if (chunk.isEmpty()) continue;
                HorarioDeAula h = um(chunk, duracaoPadraoHoras);
                if (h == null) invalidos.add(chunk); else horarios.add(h);
            }
        }
        return new Resultado(horarios, invalidos);
    }

    private static HorarioDeAula um(String chunk, int duracaoPadraoHoras) {
        String[] partes = chunk.trim().split("\\s+", 2);
        Integer dia = dia(partes[0]);
        if (dia == null || partes.length < 2) return null;
        String expr = partes[1].trim();
        Matcher intervalo = INTERVALO.matcher(expr);
        try {
            if (intervalo.matches()) {
                LocalTime ini = hora(intervalo.group(1), intervalo.group(2), intervalo.group(3));
                LocalTime fim = hora(intervalo.group(4), intervalo.group(5), intervalo.group(6));
                if (ini == null || fim == null || !fim.isAfter(ini)) return null;
                return new HorarioDeAula(dia, ini, fim);
            }
            Matcher simples = SIMPLES.matcher(expr);
            if (simples.matches()) {
                LocalTime ini = hora(simples.group(1), simples.group(2), simples.group(3));
                if (ini == null) return null;
                LocalTime fim = ini.plusHours(duracaoPadraoHoras);
                if (!fim.isAfter(ini)) return null; // passou da meia-noite
                return new HorarioDeAula(dia, ini, fim);
            }
        } catch (RuntimeException e) {
            return null;
        }
        return null;
    }
}
