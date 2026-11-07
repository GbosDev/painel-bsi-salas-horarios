import type { Disciplina, Horario, Turma } from '../api/tipos';
import { hhmm } from './horarios';

/** Colunas aceitas na planilha (mesmas do painel original). `par` = pelo menos um dos pares é obrigatório. */
export interface ColunaDoModelo {
  nome: string;
  obrigatoria: 'par' | false;
}

/**
 * Id: identifica a turma existente que a linha atualiza (vazio = localizar pela sigla ou criar turma nova).
 * Necessário quando o curso tem mais de uma turma da mesma disciplina.
 */
export const COLUNAS_DO_MODELO: ColunaDoModelo[] = [
  { nome: 'Id', obrigatoria: false },
  { nome: 'SiglaAntiga', obrigatoria: 'par' },
  { nome: 'DisciplinaAntiga', obrigatoria: 'par' },
  { nome: 'CodigoAntiga', obrigatoria: false },
  { nome: 'PeriodoAntiga', obrigatoria: false },
  { nome: 'SiglaAtual', obrigatoria: 'par' },
  { nome: 'DisciplinaAtual', obrigatoria: 'par' },
  { nome: 'CodigoAtual', obrigatoria: false },
  { nome: 'PeriodoAtual', obrigatoria: false },
  { nome: 'Professor', obrigatoria: false },
  { nome: 'Horario1', obrigatoria: false },
  { nome: 'Horario2', obrigatoria: false },
  { nome: 'Sala', obrigatoria: false },
  { nome: 'Vagas', obrigatoria: false },
];

/** Exemplo genérico, usado quando o curso de destino ainda não tem turmas cadastradas. */
export const LINHAS_DE_EXEMPLO_GENERICAS: string[][] = [
  [
    '',
    '',
    '',
    '',
    '',
    'DISC1',
    'Disciplina da grade atual',
    'COD0001',
    '1',
    'Prof. Fulano',
    '2ª 08h-10h',
    '4ª 08h-10h',
    'Sala 101',
    '40',
  ],
  [
    '',
    'DISC0',
    'Disciplina da grade antiga',
    'COD0000',
    '1',
    'DISC2',
    'Disciplina equivalente (atual)',
    'COD0002',
    '1',
    'Prof. Beltrana',
    '3ª 14h-16h',
    '',
    'Lab. 2',
    '30',
  ],
];

/** "14:00"/"14:30:00" → "14h"/"14h30" (formato aceito pelo importador). */
function horaCsv(valor: string): string {
  const [h, m] = hhmm(valor).split(':');
  return m === '00' ? `${h}h` : `${h}h${m}`;
}

/** Horário no formato da planilha oficial: "3ª 14h-16h" (2ª = segunda … 7ª = sábado). */
export function horarioCsv(h: Horario): string {
  return `${h.diaSemana + 1}ª ${horaCsv(h.inicio)}-${horaCsv(h.fim)}`;
}

function colunasDaDisciplina(d: Disciplina | null): string[] {
  return d ? [d.sigla, d.nome, d.codigo ?? '', d.periodo ?? ''] : ['', '', '', ''];
}

/**
 * Uma turma real como linha do modelo (na ordem de COLUNAS_DO_MODELO), com o Id da turma.
 * Horários além do segundo vão juntos em Horario2, separados por " | " — ao reenviar, nenhum se perde
 * (horários informados substituem todos os da turma).
 */
export function linhaDaTurma(t: Turma): string[] {
  const [h1, ...resto] = t.horarios;
  return [
    String(t.id),
    ...colunasDaDisciplina(t.curr2008),
    ...colunasDaDisciplina(t.curr2023),
    t.professor ?? '',
    h1 ? horarioCsv(h1) : '',
    resto.map(horarioCsv).join(' | '),
    t.sala ?? '',
    t.vagas ? String(t.vagas) : '',
  ];
}

/** Todas as turmas do curso, prontas para editar e reenviar (cada linha com o Id da sua turma). */
export function linhasDasTurmasAtuais(turmas: Turma[]): string[][] {
  const chave = (t: Turma) => {
    const d = t.curr2023 ?? t.curr2008;
    return `${d?.periodo ?? 'Z'}|${d?.sigla ?? ''}`;
  };
  return [...turmas].sort((a, b) => chave(a).localeCompare(chave(b), 'pt-BR', { numeric: true })).map(linhaDaTurma);
}

/**
 * Exemplo personalizado com turmas reais do curso de destino: prefere turmas completas (professor, sala e
 * horário), começando por uma que exista nas duas grades, quando houver. Sem turmas, devolve o exemplo genérico.
 */
export function linhasDeExemploDoCurso(turmas: Turma[], quantidade = 2): string[][] {
  const completas = turmas.filter((t) => t.secao === 'regular' && t.professor && t.sala && t.horarios.length > 0);
  const candidatas = completas.length > 0 ? completas : turmas;
  if (candidatas.length === 0) return LINHAS_DE_EXEMPLO_GENERICAS;
  const ordenadas = [...candidatas].sort(
    (a, b) => Number(!!b.curr2008 && !!b.curr2023) - Number(!!a.curr2008 && !!a.curr2023),
  );
  const escolhidas: Turma[] = [];
  for (const t of ordenadas) {
    const sigla = (t.curr2023 ?? t.curr2008)?.sigla;
    if (escolhidas.some((e) => (e.curr2023 ?? e.curr2008)?.sigla === sigla)) continue;
    escolhidas.push(t);
    if (escolhidas.length === quantidade) break;
  }
  return escolhidas.map(linhaDaTurma);
}

function escaparCelula(v: string): string {
  return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function gerarModeloCsv(linhas: string[][] = LINHAS_DE_EXEMPLO_GENERICAS): string {
  const cabecalho = COLUNAS_DO_MODELO.map((c) => c.nome).join(',');
  const corpo = linhas.map((l) => l.map(escaparCelula).join(','));
  return `${cabecalho}\n${corpo.join('\n')}\n`;
}
