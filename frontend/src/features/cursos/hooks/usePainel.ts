import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { PainelDoCurso } from '../../../shared/api/tipos';
import { cursos } from '../api/cursosApi';

export const chavePainel = (codigo: string) => ['painel', codigo] as const;

/** Painel de um curso (turmas, salas, curso). `recarregar` invalida o cache e busca de novo (usado após ajustes). */
export function usePainel(codigo: string) {
  const cliente = useQueryClient();
  const consulta = useQuery<PainelDoCurso>({
    queryKey: chavePainel(codigo),
    queryFn: () => cursos.painel(codigo),
    enabled: codigo !== '',
  });
  const recarregar = useCallback(async () => {
    await cliente.invalidateQueries({ queryKey: chavePainel(codigo) });
  }, [cliente, codigo]);
  return { consulta, recarregar };
}
