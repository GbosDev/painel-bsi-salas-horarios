import type { Curso, Disciplina, Turma } from '../../../shared/api/tipos';
import { DIA_CURTO, DIA_LONGO, DIAS, paraMinutos } from '../../../shared/lib/horarios';

/* Utilitários puros do "Meu plano" (sem React). Cada sessão ocupa [hora de início, hora de início + slot). */

export const DAY_ORDER: readonly number[] = DIAS;
export const DAY_SHORT: Record<number, string> = DIA_CURTO;
export const DAY_FULL: Record<number, string> = DIA_LONGO;
export const COLORS = ['#3D8577', '#7C5A72', '#B97A22', '#B65C4A', '#445374', '#2A5F55', '#5C4155'];

export interface Sessao {
  day_num: number; // 1 = Seg … 6 = Sáb
  day_short: string;
  hour: number; // hora cheia de início (ex.: 14)
}

/** Duração de cada sessão em horas: vem do curso (2 no BSI, 1 nos demais). */
export const getSlot = (curso: Curso): number => curso.duracaoAulaHoras;
export const fmtHour = (h: number): string => (h < 10 ? '0' : '') + h + ':00';
export const fmtRange = (h: number, slot: number): string => fmtHour(h) + '–' + fmtHour(h + slot);
export const overlaps = (h1: number, h2: number, slot: number): boolean => h1 < h2 + slot && h2 < h1 + slot;

/** Disciplina principal da turma: grade 2023, senão 2008. */
export const nm = (t: Turma): Partial<Disciplina> => t.curr2023 ?? t.curr2008 ?? {};
export const title = (t: Turma): string => {
  const n = nm(t);
  return (n.sigla || '—') + ' — ' + (n.nome || '');
};

export function sessoes(t: Turma): Sessao[] {
  return t.horarios.map((h) => ({
    day_num: h.diaSemana,
    day_short: DAY_SHORT[h.diaSemana] ?? '',
    hour: Math.floor(paraMinutos(h.inicio) / 60),
  }));
}

/** Linhas da grade: BSI → [8,14,16,18,20] + horas extras dos dados; outros → de hora em hora entre o menor e o maior início. */
export function getHours(turmas: Turma[], codigoCurso: string): number[] {
  const presentes = new Set<number>();
  for (const t of turmas) for (const s of sessoes(t)) presentes.add(s.hour);
  if (codigoCurso === 'bsi') {
    const base = new Set([8, 14, 16, 18, 20]);
    presentes.forEach((h) => base.add(h));
    return [...base].sort((a, b) => a - b);
  }
  if (!presentes.size) return [];
  const ordenadas = [...presentes].sort((a, b) => a - b);
  const horas: number[] = [];
  for (let h = ordenadas[0] ?? 0; h <= (ordenadas[ordenadas.length - 1] ?? 0); h++) horas.push(h);
  return horas;
}

export interface Choque {
  day: number;
  hour: number;
  end: number;
  hours: [number, number];
  recs: [Turma, Turma];
}

/** Turmas dos ids, na ordem da lista, ignorando ids que não existem mais. */
export function chosen(ids: number[], porId: Map<number, Turma>): Turma[] {
  return ids.map((id) => porId.get(id)).filter((t): t is Turma => !!t);
}

/**
 * Choques entre as turmas da lista: MESMO dia e intervalos [início, início + slot) sobrepostos
 * (não só quando começam na mesma hora). Mesma regra validada no servidor (ChoquesDoPlano.java).
 */
export function findConflicts(ids: number[], porId: Map<number, Turma>, slot: number): Choque[] {
  const recs = chosen(ids, porId);
  const out: Choque[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < recs.length; i++) {
    for (let j = i + 1; j < recs.length; j++) {
      const ri = recs[i] as Turma;
      const rj = recs[j] as Turma;
      for (const a of sessoes(ri)) {
        for (const b of sessoes(rj)) {
          if (a.day_num !== b.day_num || !overlaps(a.hour, b.hour, slot)) continue;
          const start = Math.max(a.hour, b.hour);
          const end = Math.min(a.hour, b.hour) + slot;
          const k = a.day_num + '-' + start + '-' + ri.id + '-' + rj.id;
          if (seen.has(k)) continue;
          seen.add(k);
          out.push({ day: a.day_num, hour: start, end, hours: [a.hour, b.hour], recs: [ri, rj] });
        }
      }
    }
  }
  return out;
}

export function conflictIds(lista: Choque[]): Set<number> {
  const ids = new Set<number>();
  lista.forEach((c) => c.recs.forEach((r) => ids.add(r.id)));
  return ids;
}

export function conflictCellKeys(lista: Choque[]): Set<string> {
  const m = new Set<string>();
  lista.forEach((c) => c.hours.forEach((h) => m.add(c.day + '-' + h)));
  return m;
}

export const names = (c: Choque): string => c.recs.map(title).join('  ×  ');
export const choqueRotulo = (c: Choque): string => DAY_FULL[c.day] + ' · ' + fmtHour(c.hour) + '–' + fmtHour(c.end);
