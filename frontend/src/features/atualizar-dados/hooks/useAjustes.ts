import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chavePainel } from '../../cursos/hooks/usePainel';
import { ajustes, type EdicaoDeTurma, type NovaTurma } from '../api/ajustesApi';

/** Mutações do ajuste excepcional. Todas invalidam o painel do curso para a grade refletir a mudança. */
export function useAjustes(cursoCodigo: string) {
  const cliente = useQueryClient();
  const aoSucesso = () => cliente.invalidateQueries({ queryKey: chavePainel(cursoCodigo) });
  return {
    editar: useMutation({
      mutationFn: (v: { id: number; dados: EdicaoDeTurma }) => ajustes.editar(v.id, v.dados),
      onSuccess: aoSucesso,
    }),
    criar: useMutation({ mutationFn: (dados: NovaTurma) => ajustes.criar(cursoCodigo, dados), onSuccess: aoSucesso }),
    excluir: useMutation({
      mutationFn: (v: { id: number; motivo: string }) => ajustes.excluir(v.id, v.motivo),
      onSuccess: aoSucesso,
    }),
    adicionarSala: useMutation({
      mutationFn: (nome: string) => ajustes.adicionarSala(cursoCodigo, nome),
      onSuccess: aoSucesso,
    }),
    removerSala: useMutation({
      mutationFn: (id: number) => ajustes.removerSala(cursoCodigo, id),
      onSuccess: aoSucesso,
    }),
  };
}
