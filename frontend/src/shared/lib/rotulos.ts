import type { Disciplina, Turma } from '../api/tipos';

export type Grade = '2023' | '2008';

export interface RotuloDeDisciplina {
  sigla: string;
  nome: string;
  periodo: string;
  codigo: string | null;
  grade: Grade;
}

function de(d: Disciplina, grade: Grade): RotuloDeDisciplina {
  return { sigla: d.sigla, nome: d.nome, periodo: d.periodo ?? '', codigo: d.codigo, grade };
}

/** Escolhe a sigla/nome conforme a grade preferida; se só existir uma, usa a que existe. */
export function rotuloDaTurma(t: Turma, preferida: Grade): RotuloDeDisciplina {
  if (preferida === '2023' && t.curr2023) return de(t.curr2023, '2023');
  if (preferida === '2008' && t.curr2008) return de(t.curr2008, '2008');
  if (t.curr2023) return de(t.curr2023, '2023');
  if (t.curr2008) return de(t.curr2008, '2008');
  return { sigla: '—', nome: '—', periodo: '', codigo: null, grade: '2023' };
}

/** Nome principal da turma (atual primeiro) — usado em planos e listas. */
export function nomePrincipal(t: Turma): { sigla: string; nome: string } {
  const d = t.curr2023 ?? t.curr2008;
  return { sigla: d?.sigla ?? '—', nome: d?.nome ?? '' };
}

export function profCurto(p: string | null | undefined): string {
  return p ? p.replace(/^Prof[ªa.]*\s*/i, '').trim() : '';
}

export interface LinhaDeDisciplina {
  turma: Turma;
  grade: Grade;
  sigla: string;
  nome: string;
  codigo: string | null;
  periodo: string;
}

/** Uma linha por (turma, grade presente) — base do índice de disciplinas. */
export function achatarDisciplinas(turmas: Turma[]): LinhaDeDisciplina[] {
  const saida: LinhaDeDisciplina[] = [];
  for (const t of turmas) {
    if (t.curr2008)
      saida.push({
        turma: t,
        grade: '2008',
        sigla: t.curr2008.sigla,
        nome: t.curr2008.nome,
        codigo: t.curr2008.codigo,
        periodo: t.curr2008.periodo ?? '',
      });
    if (t.curr2023)
      saida.push({
        turma: t,
        grade: '2023',
        sigla: t.curr2023.sigla,
        nome: t.curr2023.nome,
        codigo: t.curr2023.codigo,
        periodo: t.curr2023.periodo ?? '',
      });
  }
  return saida;
}

export const PERIODOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'O'];
