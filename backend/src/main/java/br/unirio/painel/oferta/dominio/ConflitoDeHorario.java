package br.unirio.painel.oferta.dominio;

import java.time.LocalTime;
import java.util.List;

/** Choque entre duas turmas: mesmo dia, intervalos que se cruzam. */
public record ConflitoDeHorario(int diaSemana, LocalTime inicio, LocalTime fim, List<Long> turmaIds, List<String> rotulos) {

    public String descricao() {
        return DiaDaSemana.completo(diaSemana) + " · " + inicio + "–" + fim + ": " + String.join("  ×  ", rotulos);
    }
}
