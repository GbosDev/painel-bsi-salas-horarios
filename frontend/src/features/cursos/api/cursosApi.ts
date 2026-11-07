import { requisitar } from '../../../shared/api/cliente';
import type { Curso, Ementa, PainelDoCurso } from '../../../shared/api/tipos';

export const cursos = {
  listar: () => requisitar<Curso[]>('GET', '/api/v1/cursos'),
  painel: (codigo: string) => requisitar<PainelDoCurso>('GET', `/api/v1/cursos/${encodeURIComponent(codigo)}/painel`),
  ementaDaTurma: (turmaId: number) => requisitar<Ementa>('GET', `/api/v1/turmas/${turmaId}/ementa`),
};
