import type { Turma } from '../api/tipos';
import { deMinutos, paraMinutos, sobrepoe } from './horarios';

export interface Conflito {
  dia: number;
  /** início/fim em minutos do trecho em que as turmas se sobrepõem */
  inicio: number;
  fim: number;
  turmas: Turma[];
}

/**
 * Choques de horário entre as turmas escolhidas, calculados sobre intervalos reais
 * (uma aula das 16h às 18h conflita com outra das 17h às 18h, mesmo começando em horas diferentes).
 * A mesma verificação é feita no servidor, que é quem decide se o plano pode ser gravado.
 */
export function encontrarConflitos(turmas: Turma[]): Conflito[] {
  const porTrecho = new Map<string, Conflito>();
  for (let i = 0; i < turmas.length; i++) {
    for (let j = i + 1; j < turmas.length; j++) {
      const a = turmas[i];
      const b = turmas[j];
      if (!a || !b) continue;
      for (const ha of a.horarios) {
        for (const hb of b.horarios) {
          if (ha.diaSemana !== hb.diaSemana) continue;
          const aIni = paraMinutos(ha.inicio);
          const aFim = paraMinutos(ha.fim);
          const bIni = paraMinutos(hb.inicio);
          const bFim = paraMinutos(hb.fim);
          if (!sobrepoe(aIni, aFim, bIni, bFim)) continue;
          const ini = Math.max(aIni, bIni);
          const fim = Math.min(aFim, bFim);
          const chave = `${ha.diaSemana}|${ini}|${fim}`;
          const existente = porTrecho.get(chave);
          if (existente) {
            for (const t of [a, b]) if (!existente.turmas.some((x) => x.id === t.id)) existente.turmas.push(t);
          } else {
            porTrecho.set(chave, { dia: ha.diaSemana, inicio: ini, fim, turmas: [a, b] });
          }
        }
      }
    }
  }
  return [...porTrecho.values()].sort((x, y) => x.dia - y.dia || x.inicio - y.inicio);
}

export function textoDoTrecho(c: Conflito): string {
  return `${deMinutos(c.inicio)}–${deMinutos(c.fim)}`;
}

/** Chaves "dia|hora cheia" das células da grade que contêm algum choque. */
export function celulasEmConflito(conflitos: Conflito[]): Set<string> {
  const chaves = new Set<string>();
  for (const c of conflitos) {
    for (let h = Math.floor(c.inicio / 60); h * 60 < c.fim; h++) chaves.add(`${c.dia}|${h}`);
  }
  return chaves;
}

/** A célula da grade [iniMin, fimMin) do dia tem algum choque? (compara intervalos reais) */
export function celulaTemConflito(conflitos: Conflito[], dia: number, iniMin: number, fimMin: number): boolean {
  return conflitos.some((c) => c.dia === dia && sobrepoe(c.inicio, c.fim, iniMin, fimMin));
}
