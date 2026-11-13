package br.unirio.painel.plano.aplicacao;

import br.unirio.painel.oferta.dominio.ConflitoDeHorario;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import br.unirio.painel.oferta.dominio.Turma;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Regra de choque do "Meu plano" — a mesma usada no front (planUtils.findConflicts).
 * Cada sessão ocupa [hora de início, hora de início + slot), onde slot é a duração da aula do curso
 * (2 h no BSI, 1 h nos demais). Há choque quando é o MESMO dia e os intervalos se sobrepõem:
 * {@code inicioA < inicioB + slot && inicioB < inicioA + slot}.
 */
public final class ChoquesDoPlano {

    private ChoquesDoPlano() { }

    public static boolean sobrepoe(int horaA, int horaB, int slot) {
        return horaA < horaB + slot && horaB < horaA + slot;
    }

    public static List<ConflitoDeHorario> entre(List<Turma> turmas, int slot) {
        List<ConflitoDeHorario> saida = new ArrayList<>();
        Set<String> vistos = new HashSet<>();
        for (int i = 0; i < turmas.size(); i++) {
            for (int j = i + 1; j < turmas.size(); j++) {
                Turma a = turmas.get(i);
                Turma b = turmas.get(j);
                for (HorarioDeAula ha : a.horarios()) {
                    for (HorarioDeAula hb : b.horarios()) {
                        int horaA = ha.inicio().getHour();
                        int horaB = hb.inicio().getHour();
                        if (ha.diaSemana() != hb.diaSemana() || !sobrepoe(horaA, horaB, slot)) continue;
                        int inicio = Math.max(horaA, horaB);
                        int fim = Math.min(horaA, horaB) + slot;
                        String chave = ha.diaSemana() + "-" + inicio + "-" + a.id() + "-" + b.id();
                        if (!vistos.add(chave)) continue;
                        saida.add(new ConflitoDeHorario(ha.diaSemana(), LocalTime.of(inicio, 0), hora(fim),
                                List.of(a.id() == null ? -1L : a.id(), b.id() == null ? -1L : b.id()),
                                List.of(a.rotulo(), b.rotulo())));
                    }
                }
            }
        }
        return saida;
    }

    private static LocalTime hora(int h) {
        return h >= 24 ? LocalTime.of(23, 59) : LocalTime.of(h, 0);
    }
}
