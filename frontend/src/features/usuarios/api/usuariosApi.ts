import { requisitar } from '../../../shared/api/cliente';
import type { Perfil, UsuarioResumo } from '../../../shared/api/tipos';

/** Estudante: matrícula + nome (o login é a matrícula). Professor: login + nome. */
export interface NovoUsuario {
  login: string | null;
  nome: string;
  senha: string;
  perfil: Perfil;
  matricula: string | null;
}

export const usuarios = {
  listar: () => requisitar<UsuarioResumo[]>('GET', '/api/v1/usuarios'),
  criar: (dados: NovoUsuario) => requisitar<UsuarioResumo>('POST', '/api/v1/usuarios', { corpo: dados }),
  /** Somente a conta de administração (a API responde 403 para as demais). */
  definirAtivo: (id: number, ativo: boolean) =>
    requisitar<UsuarioResumo>('PUT', `/api/v1/usuarios/${id}/ativo`, { corpo: { ativo } }),
  excluir: (id: number) => requisitar<void>('DELETE', `/api/v1/usuarios/${id}`),
};
