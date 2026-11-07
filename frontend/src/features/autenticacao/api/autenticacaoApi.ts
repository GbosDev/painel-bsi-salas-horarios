import { requisitar } from '../../../shared/api/cliente';
import type { Usuario } from '../../../shared/api/tipos';

export const autenticacao = {
  eu: () => requisitar<Usuario>('GET', '/api/v1/auth/eu', { silencioso401: true }),
  entrar: (login: string, senha: string) =>
    requisitar<Usuario>('POST', '/api/v1/auth/login', { corpo: { login, senha }, silencioso401: true }),
  sair: () => requisitar<void>('POST', '/api/v1/auth/logout', { silencioso401: true }),
  alterarSenha: (senhaAtual: string, novaSenha: string) =>
    requisitar<void>('PUT', '/api/v1/auth/senha', { corpo: { senhaAtual, novaSenha } }),
};
