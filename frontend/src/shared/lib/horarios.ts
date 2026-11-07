import type { Horario, Turma } from '../api/tipos';

export const DIAS = [1, 2, 3, 4, 5, 6] as const;
export const DIA_CURTO: Record<number, string> = { 1: 'SEG', 2: 'TER', 3: 'QUA', 4: 'QUI', 5: 'SEX', 6: 'SÁB' };
export const DIA_LONGO: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

/** "14:00" ou "14:00:00" → minutos desde 00:00. */
export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':');
  return Number(h) * 60 + Number(m ?? 0);
}

/** "14:00:00" → "14:00". */
export function hhmm(valor: string): string {
  return valor.slice(0, 5);
}

export function deMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatarHora(hora: number): string {
  return `${String(hora).padStart(2, '0')}:00`;
}

/** Dois intervalos [ini, fim) se sobrepõem quando cada um começa antes de o outro terminar. */
export function sobrepoe(aIni: number, aFim: number, bIni: number, bFim: number): boolean {
  return aIni < bFim && bIni < aFim;
}

export interface Agora {
  /** 1 (segunda) … 7 (domingo) */
  dia: number;
  /** minutos desde 00:00 */
  minutos: number;
}

export function agoraDe(data: Date): Agora {
  const js = data.getDay(); // 0 = domingo
  return { dia: js === 0 ? 7 : js, minutos: data.getHours() * 60 + data.getMinutes() };
}

export function horarioEmAula(h: Horario, agora: Agora): boolean {
  return h.diaSemana === agora.dia && paraMinutos(h.inicio) <= agora.minutos && agora.minutos < paraMinutos(h.fim);
}

export function turmaEmAula(t: Turma, agora: Agora): boolean {
  return t.horarios.some((h) => horarioEmAula(h, agora));
}

export function relogioTexto(agora: Agora): string {
  if (agora.dia > 6) return 'Domingo · sem aulas';
  return `${DIA_CURTO[agora.dia] ?? ''} · ${deMinutos(agora.minutos)}`;
}

/**
 * Horas de início oferecidas nos filtros. Cursos com aula de 2h (BSI) usam os inícios
 * existentes; os demais listam todas as horas entre o primeiro e o último início.
 */
export function opcoesDeInicio(turmas: Turma[], duracaoHoras: number): number[] {
  const inicios = new Set<number>();
  for (const t of turmas) for (const h of t.horarios) inicios.add(Math.floor(paraMinutos(h.inicio) / 60));
  if (inicios.size === 0) return [];
  const ordenados = [...inicios].sort((a, b) => a - b);
  if (duracaoHoras >= 2) return ordenados;
  const menor = ordenados[0] ?? 0;
  const maior = ordenados[ordenados.length - 1] ?? menor;
  const todas: number[] = [];
  for (let h = menor; h <= maior; h++) todas.push(h);
  return todas;
}

/** Faixa pré-selecionada: a última cujo início já passou (ou a primeira). */
export function inicioPadrao(opcoes: number[], agora: Agora): number {
  const hora = Math.floor(agora.minutos / 60);
  let escolhida = opcoes[0] ?? 8;
  for (const o of opcoes) if (o <= hora) escolhida = o;
  return escolhida;
}

export function diaPadrao(agora: Agora): number {
  return agora.dia <= 6 ? agora.dia : 1;
}

/** Turma que ocupa a sala em qualquer parte do intervalo pedido (sobreposição real). */
export function ocupacaoDaSala(
  turmas: Turma[],
  sala: string,
  dia: number,
  iniMin: number,
  fimMin: number,
): Turma | null {
  for (const t of turmas) {
    if (t.sala !== sala) continue;
    for (const h of t.horarios) {
      if (h.diaSemana === dia && sobrepoe(paraMinutos(h.inicio), paraMinutos(h.fim), iniMin, fimMin)) return t;
    }
  }
  return null;
}

export function horariosEmTexto(t: Turma): string {
  return t.horarios.map((h) => `${DIA_CURTO[h.diaSemana] ?? '?'} ${hhmm(h.inicio)}`).join(' · ');
}
