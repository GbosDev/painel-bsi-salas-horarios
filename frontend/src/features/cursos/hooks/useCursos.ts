import { useQuery } from '@tanstack/react-query';
import type { Curso } from '../../../shared/api/tipos';
import { cursos as apiCursos } from '../api/cursosApi';

export const CHAVE_CURSOS = ['cursos'] as const;

interface ValorDeCursos {
  cursos: Curso[];
  carregando: boolean;
  erro: string | null;
  tentarDeNovo: () => void;
}

/** Lista de cursos (estado do servidor via TanStack Query). */
export function useCursos(): ValorDeCursos {
  const consulta = useQuery({ queryKey: CHAVE_CURSOS, queryFn: apiCursos.listar, staleTime: 5 * 60_000 });
  return {
    cursos: consulta.data ?? [],
    carregando: consulta.isPending,
    erro: consulta.isError ? consulta.error.message : null,
    tentarDeNovo: () => void consulta.refetch(),
  };
}
