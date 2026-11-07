package br.unirio.painel.oferta.dominio;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/** Regra de conflito por intervalos reais (início/fim), não por hora exata. */
public final class ConflitosDeHorario {

    private ConflitosDeHorario() { }

    /** Todos os pares de turmas que se cruzam, no máximo um conflito por par e por dia. */
    public static List<ConflitoDeHorario> entre(Collection<Turma> turmas) {
        List<Turma> lista = new ArrayList<>(turmas);
        List<ConflitoDeHorario> conflitos = new ArrayList<>();
        for (int i = 0; i < lista.size(); i++) {
            for (int j = i + 1; j < lista.size(); j++) {
                Turma a = lista.get(i);
                Turma b = lista.get(j);
                for (int dia = 1; dia <= 6; dia++) {
                    LocalTime ini = null;
                    LocalTime fim = null;
                    for (HorarioDeAula ha : a.horarios()) {
                        if (ha.diaSemana() != dia) continue;
                        for (HorarioDeAula hb : b.horarios()) {
                            if (!ha.sobrepoe(hb)) continue;
                            LocalTime i2 = ha.inicio().isAfter(hb.inicio()) ? ha.inicio() : hb.inicio();
                            LocalTime f2 = ha.fim().isBefore(hb.fim()) ? ha.fim() : hb.fim();
                            ini = ini == null || i2.isBefore(ini) ? i2 : ini;
                            fim = fim == null || f2.isAfter(fim) ? f2 : fim;
                        }
                    }
                    if (ini != null) {
                        conflitos.add(new ConflitoDeHorario(dia, ini, fim,
                                List.of(a.id() == null ? -1L : a.id(), b.id() == null ? -1L : b.id()),
                                List.of(a.rotulo(), b.rotulo())));
                    }
                }
            }
        }
        conflitos.sort((x, y) -> x.diaSemana() != y.diaSemana()
                ? Integer.compare(x.diaSemana(), y.diaSemana()) : x.inicio().compareTo(y.inicio()));
        return conflitos;
    }
}
