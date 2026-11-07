import type { Turma } from '../api/tipos';

export type TipoDeMatch = 'professor' | 'sala' | 'sigla' | 'disciplina';

export interface ResultadoDeBusca {
  turma: Turma;
  tipo: TipoDeMatch;
}

/** Busca da barra principal: identifica por que a turma casou (professor, sala, sigla/código ou nome). */
export function buscarTurmas(turmas: Turma[], consulta: string, limite = 8): ResultadoDeBusca[] {
  const q = consulta.toLowerCase().trim();
  if (!q) return [];
  const saida: ResultadoDeBusca[] = [];
  for (const turma of turmas) {
    const prof = (turma.professor ?? '').toLowerCase();
    const sala = (turma.sala ?? '').toLowerCase();
    const siglas = [turma.curr2023?.sigla, turma.curr2008?.sigla].filter(Boolean).join(' ').toLowerCase();
    const codigos = [turma.curr2023?.codigo, turma.curr2008?.codigo].filter(Boolean).join(' ').toLowerCase();
    const nomes = [turma.curr2023?.nome, turma.curr2008?.nome].filter(Boolean).join(' ').toLowerCase();
    let tipo: TipoDeMatch | null = null;
    if (prof.includes(q)) tipo = 'professor';
    else if (sala.includes(q)) tipo = 'sala';
    else if (siglas.includes(q) || codigos.includes(q)) tipo = 'sigla';
    else if (nomes.includes(q)) tipo = 'disciplina';
    if (tipo) saida.push({ turma, tipo });
  }
  return saida.slice(0, limite);
}

/** Texto pesquisável de uma turma (grade horária, plano). */
export function textoDaTurma(t: Turma): string {
  return [t.professor, t.sala, t.curr2023?.sigla, t.curr2023?.nome, t.curr2008?.sigla, t.curr2008?.nome]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
