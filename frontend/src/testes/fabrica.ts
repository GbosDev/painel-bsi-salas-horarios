import type { Curso, Disciplina, Horario, Sala, Turma } from '../shared/api/tipos';

let proximoId = 1;

export function disc(sigla: string, nome = `Disciplina ${sigla}`, periodo = '1'): Disciplina {
  return { sigla, codigo: `COD-${sigla}`, nome, periodo, posGraduacao: false };
}

export function hor(diaSemana: number, inicio: string, fim: string): Horario {
  return { diaSemana, inicio, fim };
}

export function turma(parcial: Partial<Turma> & { horarios?: Horario[] } = {}): Turma {
  return {
    id: proximoId++,
    curr2008: null,
    curr2023: disc('AAA'),
    professor: 'Prof. Teste',
    sala: 'Sala 1',
    vagas: 30,
    secao: 'regular',
    ementaUrl: null,
    aviso: null,
    origem: 'legado',
    versao: 0,
    editada: false,
    horarios: [],
    ...parcial,
  };
}

export function sala(nome: string, turmasEmUso = 0, id = proximoId++): Sala {
  return { id, nome, turmasEmUso };
}

export function curso(parcial: Partial<Curso> = {}): Curso {
  return {
    codigo: 'bsi',
    sigla: 'BSI',
    nome: 'Sistemas de Informação',
    centro: { sigla: 'CCET', nome: 'Centro de Ciências Exatas e Tecnologia', descricao: null },
    situacao: 'completo',
    descricao: null,
    tema: 'padrao',
    alternaMatrizes: true,
    duracaoAulaHoras: 2,
    ...parcial,
  };
}
