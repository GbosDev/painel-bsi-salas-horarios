import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirAoPerderSessao, ErroDeApi, requisitar } from '../shared/api/cliente';

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function limparCookies() {
  for (const c of document.cookie.split('; ')) {
    const nome = c.split('=')[0];
    if (nome) document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

describe('cliente da API', () => {
  const fetchFalso = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();

  beforeEach(() => {
    limparCookies();
    fetchFalso.mockReset();
    vi.stubGlobal('fetch', fetchFalso);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    definirAoPerderSessao(null);
  });

  it('GET não pede token CSRF', async () => {
    fetchFalso.mockResolvedValueOnce(resposta(200, { ok: true }));
    await requisitar('GET', '/api/v1/cursos');
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    const init = fetchFalso.mock.calls[0]?.[1];
    expect((init?.headers as Record<string, string>)['X-XSRF-TOKEN']).toBeUndefined();
    expect(init?.credentials).toBe('same-origin');
  });

  it('POST sem cookie busca /api/auth/csrf antes e envia o cabeçalho X-XSRF-TOKEN', async () => {
    fetchFalso.mockImplementation(async (url) => {
      if (url === '/api/v1/auth/csrf') {
        document.cookie = 'XSRF-TOKEN=abc123; path=/';
        return resposta(200, { token: 'abc123' });
      }
      return resposta(200, { feito: true });
    });
    const r = await requisitar<{ feito: boolean }>('POST', '/api/v1/turmas/1/exclusao', {
      corpo: { motivo: 'teste de motivo' },
    });
    expect(r.feito).toBe(true);
    expect(fetchFalso.mock.calls.map((c) => c[0])).toEqual(['/api/v1/auth/csrf', '/api/v1/turmas/1/exclusao']);
    const init = fetchFalso.mock.calls[1]?.[1];
    expect((init?.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('abc123');
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init?.body).toBe(JSON.stringify({ motivo: 'teste de motivo' }));
  });

  it('reaproveita o cookie CSRF existente', async () => {
    document.cookie = 'XSRF-TOKEN=ja-existe; path=/';
    fetchFalso.mockResolvedValueOnce(resposta(200, {}));
    await requisitar('PUT', '/api/v1/auth/senha', { corpo: {} });
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect((fetchFalso.mock.calls[0]?.[1]?.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('ja-existe');
  });

  it('upload multipart não define Content-Type (o navegador acrescenta o boundary)', async () => {
    document.cookie = 'XSRF-TOKEN=t; path=/';
    fetchFalso.mockResolvedValueOnce(resposta(200, {}));
    const f = new FormData();
    f.append('arquivo', new File(['a,b'], 'x.csv', { type: 'text/csv' }));
    await requisitar('POST', '/api/v1/cursos/bsi/importacoes', { formulario: f });
    const init = fetchFalso.mock.calls[0]?.[1];
    expect((init?.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    expect(init?.body).toBe(f);
  });

  it('204 devolve undefined', async () => {
    document.cookie = 'XSRF-TOKEN=t; path=/';
    fetchFalso.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(requisitar('POST', '/api/v1/auth/logout')).resolves.toBeUndefined();
  });

  it('erro da API vira ErroDeApi com código, mensagem e detalhes', async () => {
    fetchFalso.mockResolvedValueOnce(
      resposta(409, { codigo: 'plano_com_conflito', detail: 'Conflito!', detalhes: ['a', 'b'] }),
    );
    const e = await requisitar('GET', '/api/v1/x').catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ErroDeApi);
    expect(e).toMatchObject({ status: 409, codigo: 'plano_com_conflito', message: 'Conflito!', detalhes: ['a', 'b'] });
  });

  it('401 dispara o tratamento de sessão expirada, exceto quando silencioso', async () => {
    const aviso = vi.fn();
    definirAoPerderSessao(aviso);
    fetchFalso.mockResolvedValue(resposta(401, { codigo: 'nao_autenticado', detail: 'Faça login.' }));
    await requisitar('GET', '/api/v1/cursos').catch(() => undefined);
    expect(aviso).toHaveBeenCalledTimes(1);
    await requisitar('GET', '/api/v1/auth/eu', { silencioso401: true }).catch(() => undefined);
    expect(aviso).toHaveBeenCalledTimes(1);
  });

  it('falha de rede vira mensagem amigável', async () => {
    fetchFalso.mockRejectedValueOnce(new TypeError('network'));
    await expect(requisitar('GET', '/api/v1/x')).rejects.toMatchObject({ status: 0 });
  });
});
