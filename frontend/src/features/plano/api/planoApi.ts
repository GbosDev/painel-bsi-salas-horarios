import { requisitar } from '../../../shared/api/cliente';
import type { PlanoDoAluno } from '../../../shared/api/tipos';

export const plano = {
  obter: (curso: string) => requisitar<PlanoDoAluno>('GET', `/api/v1/cursos/${encodeURIComponent(curso)}/plano`),
  salvar: (curso: string, turmaIds: number[]) =>
    requisitar<PlanoDoAluno>('PUT', `/api/v1/cursos/${encodeURIComponent(curso)}/plano`, { corpo: { turmaIds } }),
};
