import type { CorpoDeErro } from './tipos';

/** Erro devolvido pela API (Problem Details RFC 9457 + codigo e detalhes). */
export class ErroDeApi extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalhes: string[];

  constructor(status: number, corpo: CorpoDeErro | null, mensagemPadrao: string) {
    super(corpo?.detail ?? mensagemPadrao);
    this.name = 'ErroDeApi';
    this.status = status;
    this.codigo = corpo?.codigo ?? 'erro';
    this.detalhes = corpo?.detalhes ?? [];
  }
}

const NOME_COOKIE_CSRF = 'XSRF-TOKEN';
const NOME_CABECALHO_CSRF = 'X-XSRF-TOKEN';

let aoPerderSessao: (() => void) | null = null;

/** Registrada pelo provedor de sessão: chamada quando a API responde 401 numa sessão que existia. */
export function definirAoPerderSessao(fn: (() => void) | null): void {
  aoPerderSessao = fn;
}

export function lerCookie(nome: string): string | null {
  const pares = document.cookie ? document.cookie.split('; ') : [];
  for (const par of pares) {
    const i = par.indexOf('=');
    if (i > 0 && par.slice(0, i) === nome) return decodeURIComponent(par.slice(i + 1));
  }
  return null;
}

async function garantirTokenCsrf(): Promise<string | null> {
  const existente = lerCookie(NOME_COOKIE_CSRF);
  if (existente) return existente;
  await fetch('/api/v1/auth/csrf', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
  return lerCookie(NOME_COOKIE_CSRF);
}

interface Opcoes {
  corpo?: unknown;
  formulario?: FormData;
  /** Não dispara o tratamento global de sessão expirada (usado no login e na verificação inicial). */
  silencioso401?: boolean;
}

export async function requisitar<T>(metodo: string, caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const cabecalhos: Record<string, string> = { Accept: 'application/json' };
  let corpo: BodyInit | undefined;
  if (opcoes.formulario) {
    corpo = opcoes.formulario; // o navegador define o Content-Type multipart com o boundary
  } else if (opcoes.corpo !== undefined) {
    cabecalhos['Content-Type'] = 'application/json';
    corpo = JSON.stringify(opcoes.corpo);
  }
  if (metodo !== 'GET') {
    const token = await garantirTokenCsrf();
    if (token) cabecalhos[NOME_CABECALHO_CSRF] = token;
  }

  let resposta: Response;
  try {
    resposta = await fetch(caminho, { method: metodo, headers: cabecalhos, body: corpo, credentials: 'same-origin' });
  } catch {
    throw new ErroDeApi(0, null, 'Não foi possível falar com o servidor. Verifique a conexão e tente novamente.');
  }

  if (resposta.ok) {
    if (resposta.status === 204) return undefined as T;
    const texto = await resposta.text();
    return (texto ? JSON.parse(texto) : undefined) as T;
  }

  let corpoErro: CorpoDeErro | null = null;
  try {
    corpoErro = (await resposta.json()) as CorpoDeErro;
  } catch {
    corpoErro = null;
  }
  if (resposta.status === 401 && !opcoes.silencioso401 && aoPerderSessao) aoPerderSessao();
  throw new ErroDeApi(resposta.status, corpoErro, `Erro ${resposta.status} ao falar com o servidor.`);
}
