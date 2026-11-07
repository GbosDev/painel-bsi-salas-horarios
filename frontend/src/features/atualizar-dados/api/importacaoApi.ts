import { requisitar } from '../../../shared/api/cliente';
import type { PreviaDeImportacao, ResultadoDeAplicacao } from '../../../shared/api/tipos';

export const importacao = {
  previa: (curso: string, arquivo: File) => {
    const formulario = new FormData();
    formulario.append('arquivo', arquivo);
    return requisitar<PreviaDeImportacao>('POST', `/api/v1/cursos/${encodeURIComponent(curso)}/importacoes`, {
      formulario,
    });
  },
  aplicar: (loteId: number, observacao: string) =>
    requisitar<ResultadoDeAplicacao>('POST', `/api/v1/importacoes/${loteId}/aplicacao`, { corpo: { observacao } }),
};
