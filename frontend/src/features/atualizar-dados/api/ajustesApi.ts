import { requisitar } from '../../../shared/api/cliente';
import type { HorarioEnvio, ResultadoDeAjuste } from '../../../shared/api/tipos';

export interface EdicaoDeTurma {
  professor: string;
  sala: string | null;
  vagas: number;
  horarios: HorarioEnvio[];
  versao: number;
  motivo: string;
}

export interface NovaTurma {
  sigla: string;
  disciplina: string;
  codigo: string;
  periodo: string;
  professor: string;
  sala: string | null;
  vagas: number;
  horarios: HorarioEnvio[];
  motivo: string;
}

export const ajustes = {
  editar: (id: number, dados: EdicaoDeTurma) =>
    requisitar<ResultadoDeAjuste>('PUT', `/api/v1/turmas/${id}`, { corpo: dados }),
  criar: (curso: string, dados: NovaTurma) =>
    requisitar<ResultadoDeAjuste>('POST', `/api/v1/cursos/${encodeURIComponent(curso)}/turmas`, { corpo: dados }),
  excluir: (id: number, motivo: string) =>
    requisitar<void>('POST', `/api/v1/turmas/${id}/exclusao`, { corpo: { motivo } }),
  adicionarSala: (curso: string, nome: string) =>
    requisitar<void>('POST', `/api/v1/cursos/${encodeURIComponent(curso)}/salas`, { corpo: { nome } }),
  removerSala: (curso: string, salaId: number) =>
    requisitar<void>('DELETE', `/api/v1/cursos/${encodeURIComponent(curso)}/salas/${salaId}`),
};
