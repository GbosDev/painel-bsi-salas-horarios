package br.unirio.painel.oferta.dominio;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/** Calcula o "antes/depois" gravado no histórico (professor, sala, vagas e horários). */
public final class DiferencaDeTurma {

    public record Resultado(Map<String, Object> antes, Map<String, Object> depois) {
        public boolean vazia() { return antes.isEmpty() && depois.isEmpty(); }
    }

    private DiferencaDeTurma() { }

    public static Resultado entre(Turma antes, Turma depois) {
        Map<String, Object> a = new LinkedHashMap<>();
        Map<String, Object> d = new LinkedHashMap<>();
        comparar(a, d, "professor", antes.professor(), depois.professor());
        comparar(a, d, "sala", antes.sala(), depois.sala());
        comparar(a, d, "vagas", antes.vagas(), depois.vagas());
        String ha = horarios(antes);
        String hd = horarios(depois);
        if (!ha.equals(hd)) {
            a.put("horarios", ha);
            d.put("horarios", hd);
        }
        return new Resultado(a, d);
    }

    /** Resumo "completo" de uma turma, usado em criação/exclusão. */
    public static Map<String, Object> resumo(Turma t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("professor", t.professor() == null ? "—" : t.professor());
        m.put("sala", t.sala() == null ? "—" : t.sala());
        m.put("vagas", t.vagas());
        m.put("horarios", horarios(t));
        return m;
    }

    public static String horarios(Turma t) {
        String s = t.horarios().stream().map(HorarioDeAula::rotulo).collect(Collectors.joining(" · "));
        return s.isEmpty() ? "—" : s;
    }

    private static void comparar(Map<String, Object> a, Map<String, Object> d, String campo, Object antes, Object depois) {
        if (!Objects.equals(antes == null ? "" : String.valueOf(antes), depois == null ? "" : String.valueOf(depois))) {
            a.put(campo, antes == null ? "—" : antes);
            d.put(campo, depois == null ? "—" : depois);
        }
    }
}
