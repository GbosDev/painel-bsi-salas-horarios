// Formatos JSON da API (espelham os DTOs do backend).

export type Perfil = 'ALUNO' | 'PROFESSOR';

export interface Usuario {
  id: number;
  /** Estudante: o login é a matrícula. */
  login: string;
  nome: string;
  perfil: Perfil;
  matricula?: string | null;
  /** Conta de administração: única que ativa, desativa e apaga contas. */
  administrador?: boolean;
}

export interface Centro {
  sigla: string;
  nome: string;
  descricao: string | null;
}

export interface Curso {
  codigo: string;
  sigla: string;
  nome: string;
  centro: Centro;
  situacao: string; // 'completo' | 'escopo'
  descricao: string | null;
  tema: string; // 'padrao' | 'eng' | 'mat' | 'ibio'
  alternaMatrizes: boolean;
  duracaoAulaHoras: number;
}

export interface Sala {
  id: number;
  nome: string;
  turmasEmUso: number;
}

export interface Disciplina {
  sigla: string;
  codigo: string | null;
  nome: string;
  periodo: string | null;
  posGraduacao: boolean;
}

export interface Horario {
  diaSemana: number; // 1 = segunda ... 6 = sábado
  inicio: string; // "HH:mm"
  fim: string; // "HH:mm"
}

export interface Turma {
  id: number;
  curr2008: Disciplina | null;
  curr2023: Disciplina | null;
  professor: string | null;
  sala: string | null;
  vagas: number;
  secao: string; // 'regular' | 'pos'
  ementaUrl: string | null;
  /** Aviso opcional da coordenação sobre a turma (ex.: conflito de sala conhecido). */
  aviso: string | null;
  origem: string; // 'legado' | 'csv' | 'excepcional'
  versao: number;
  editada: boolean;
  horarios: Horario[];
}

export interface PainelDoCurso {
  curso: Curso;
  periodoLetivo: string;
  salas: Sala[];
  turmas: Turma[];
}

export interface Ementa {
  codigo: string;
  nome: string;
  texto: string;
  fonte: string;
}

export interface HorarioEnvio {
  diaSemana: number;
  inicio: string;
  fim: string;
}

export interface ResultadoDeAjuste {
  turma: Turma;
  avisos: string[];
}

export type AcaoDaLinha = 'criar' | 'atualizar' | 'sem_alteracao';

export interface LinhaDePrevia {
  numero: number;
  situacao: 'ok' | 'aviso' | 'erro';
  /** O que a aplicação fará com a linha (null = linha com erro, não aplicada). */
  acao: AcaoDaLinha | null;
  mensagem: string | null;
  sigla: string | null;
  disciplina: string | null;
  professor: string | null;
  sala: string | null;
  horarios: Horario[];
}

export interface PreviaDeImportacao {
  loteId: number;
  nomeArquivo: string;
  formatoDuplo: boolean;
  totalLinhas: number;
  totalOk: number;
  totalAviso: number;
  totalErro: number;
  totalCriar: number;
  totalAtualizar: number;
  totalSemAlteracao: number;
  avisoGeral: string | null;
  linhas: LinhaDePrevia[];
}

export interface ResultadoDeAplicacao {
  loteId: number;
  criadas: number;
  atualizadas: number;
  semAlteracao: number;
  salasCriadas: number;
}

export interface RegistroDeAuditoria {
  id: number;
  ocorridaEm: string;
  autor: string;
  autorPerfil: string;
  cursoCodigo: string | null;
  cursoNome: string | null;
  tipo: string;
  turmaId: number | null;
  turmaSigla: string | null;
  turmaNome: string | null;
  motivo: string | null;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
  importacaoLoteId: number | null;
}

export interface PlanoDoAluno {
  turmaIds: number[];
  atualizadoEm: string | null;
}

export interface UsuarioResumo {
  id: number;
  login: string;
  nome: string;
  perfil: Perfil;
  matricula: string | null;
  ativo: boolean;
  administrador: boolean;
}

/** Problem Details (RFC 9457, application/problem+json) + extensões `codigo` e `detalhes`. */
export interface CorpoDeErro {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  codigo?: string;
  detalhes?: string[];
}
