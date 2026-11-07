package br.unirio.painel.oferta.dominio;

import br.unirio.painel.compartilhado.ErroDeNegocio;
import java.time.LocalTime;
import java.util.Objects;

/** Intervalo semanal real de uma aula (início inclusivo, fim exclusivo). */
public record HorarioDeAula(int diaSemana, LocalTime inicio, LocalTime fim) {

    public HorarioDeAula {
        if (!DiaDaSemana.valido(diaSemana)) {
            throw ErroDeNegocio.invalido("horario_dia_invalido", "Dia da semana inválido: " + diaSemana + " (use 1 a 6).");
        }
        Objects.requireNonNull(inicio, "inicio");
        Objects.requireNonNull(fim, "fim");
        if (!fim.isAfter(inicio)) {
            throw ErroDeNegocio.invalido("horario_intervalo_invalido", "O horário final deve ser depois do inicial.");
        }
    }

    public static HorarioDeAula deHoras(int dia, int horaInicio, int horaFim) {
        return new HorarioDeAula(dia, LocalTime.of(horaInicio, 0), LocalTime.of(horaFim, 0));
    }

    /** Dois horários colidem se são no mesmo dia e os intervalos se cruzam (encostar não é colidir). */
    public boolean sobrepoe(HorarioDeAula outro) {
        return diaSemana == outro.diaSemana && inicio.isBefore(outro.fim) && outro.inicio.isBefore(fim);
    }

    /** Formato usado no histórico: "SEG 14:00–16:00". */
    public String rotulo() {
        return DiaDaSemana.curto(diaSemana) + " " + inicio + "–" + fim;
    }
}
