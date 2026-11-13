import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Curso, PainelDoCurso, Perfil, Turma, Usuario } from '../shared/api/tipos';
import { Cabecalho, abasDoPerfil, montarItensDoSeletor } from '../app/layout/Cabecalho';
import { Login } from '../features/autenticacao/components/Login';
import { VisaoMeuPlano } from '../features/plano/components/VisaoMeuPlano';
import { VisaoSalas } from '../features/salas/components/VisaoSalas';
import { AgoraProvider } from '../shared/contexto/Agora';
import { DicasProvider } from '../shared/contexto/Dicas';
import { PainelDoCursoProvider } from '../features/cursos/hooks/PainelDoCurso';
import { SessaoProvider } from '../features/autenticacao/hooks/Sessao';
import { ToastsProvider } from '../shared/ui/Toasts';
import { renderizar } from './envoltorio';
import { curso, disc, hor, sala, turma } from './fabrica';

function json(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type Rota = (url: string, init?: RequestInit) => Response | Promise<Response> | undefined;
function simularApi(rotas: Rota[]) {
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    for (const r of rotas) {
      const res = await r(url, init);
      if (res) return res;
    }
    return json(404, { codigo: 'nao_encontrado', detail: 'rota não simulada: ' + url });
  });
  vi.stubGlobal('fetch', f);
  return f;
}

beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=teste; path=/';
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Login', () => {
  function montar() {
    return renderizar(
      <MemoryRouter initialEntries={['/login']}>
        <SessaoProvider>
          <Login />
        </SessaoProvider>
      </MemoryRouter>,
    );
  }

  it('não exibe contas de teste nem senhas (credenciais só existem no servidor)', async () => {
    simularApi([(u) => (u === '/api/v1/auth/eu' ? json(401, { codigo: 'nao_autenticado', detail: 'x' }) : undefined)]);
    montar();
    await screen.findByRole('button', { name: 'Entrar' });
    expect(document.body.textContent).not.toMatch(/aluno1|jef2026|job2026|gei2026|456|123/);
    expect(screen.queryByText(/Contas de teste/i)).toBeNull();
  });

  it('mostra a mensagem devolvida pelo servidor quando o login falha e limpa a senha', async () => {
    simularApi([
      (u) => (u === '/api/v1/auth/eu' ? json(401, { codigo: 'nao_autenticado', detail: 'x' }) : undefined),
      (u) =>
        u === '/api/v1/auth/login'
          ? json(401, { codigo: 'credenciais_invalidas', detail: 'Usuário ou senha incorretos.' })
          : undefined,
    ]);
    montar();
    const usuario = await screen.findByLabelText('Matrícula ou usuário');
    await userEvent.type(usuario, 'ana');
    const senha = screen.getByLabelText('Senha') as HTMLInputElement;
    await userEvent.type(senha, 'errada');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha incorretos.');
    expect(senha.value).toBe('');
  });

  it('envia login e senha em JSON com o token CSRF', async () => {
    const f = simularApi([
      (u) => (u === '/api/v1/auth/eu' ? json(401, { codigo: 'nao_autenticado', detail: 'x' }) : undefined),
      (u) =>
        u === '/api/v1/auth/login' ? json(200, { id: 1, login: 'ana', nome: 'Ana', perfil: 'ALUNO' }) : undefined,
    ]);
    montar();
    await userEvent.type(await screen.findByLabelText('Matrícula ou usuário'), '  ana ');
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo-123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(f.mock.calls.some((c) => c[0] === '/api/v1/auth/login')).toBe(true));
    const chamada = f.mock.calls.find((c) => c[0] === '/api/v1/auth/login');
    expect(chamada?.[1]?.method).toBe('POST');
    expect((chamada?.[1]?.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('teste');
    expect(JSON.parse(String(chamada?.[1]?.body))).toEqual({ login: 'ana', senha: 'segredo-123' });
  });
});

describe('Cabeçalho e seletor de curso', () => {
  it('estudante vê 4 abas; professor vê 6, com Painel, Atualizar dados e Histórico', () => {
    expect(abasDoPerfil('ALUNO').map((a) => a.rotulo)).toEqual(['Salas', 'Grade horária', 'Disciplinas', 'Meu plano']);
    expect(abasDoPerfil('PROFESSOR').map((a) => a.rotulo)).toEqual([
      'Salas',
      'Grade horária',
      'Disciplinas',
      'Painel',
      'Atualizar dados',
      'Histórico',
    ]);
  });

  it('agrupa os cursos do IBIO em um único item e mantém os do CCET separados', () => {
    const ccet = { sigla: 'CCET', nome: 'Centro de Ciências Exatas e Tecnologia', descricao: null };
    const ibio = {
      sigla: 'IBIO',
      nome: 'Instituto de Biociências',
      descricao: 'Escolha o curso do Instituto de Biociências',
    };
    const itens = montarItensDoSeletor([
      curso({ codigo: 'bsi', centro: ccet }),
      curso({ codigo: 'eng', sigla: 'ENG', centro: ccet }),
      curso({ codigo: 'ibio-bcb', sigla: 'CBIO·B', centro: ibio }),
      curso({ codigo: 'ibio-lcb', sigla: 'CBIO·L', centro: ibio }),
    ]);
    expect(itens.map((i) => (i.tipo === 'curso' ? i.curso.codigo : `grupo:${i.sigla}(${i.cursos.length})`))).toEqual([
      'bsi',
      'eng',
      'grupo:IBIO(2)',
    ]);
  });

  function montarCabecalho(perfil: Perfil, cursosDaApi: Curso[]) {
    const usuario: Usuario = { id: 1, login: 'u', nome: 'Fulano', perfil };
    simularApi([
      (u) => (u === '/api/v1/auth/eu' ? json(200, usuario) : undefined),
      (u) => (u === '/api/v1/cursos' ? json(200, cursosDaApi) : undefined),
    ]);
    return renderizar(
      <MemoryRouter>
        <SessaoProvider>
          <Cabecalho
            codigoAtual="bsi"
            aba="predio"
            mostrarGrade
            grade="2023"
            aoMudarGrade={() => undefined}
            aoMudarAba={() => undefined}
          />
        </SessaoProvider>
      </MemoryRouter>,
    );
  }

  it('professor tem acesso ao botão de usuários; estudante não', async () => {
    const p = montarCabecalho('PROFESSOR', [curso()]);
    expect(await screen.findByRole('button', { name: 'usuários' })).toBeInTheDocument();
    p.unmount();
    montarCabecalho('ALUNO', [curso()]);
    await screen.findByText('Estudante');
    expect(screen.queryByRole('button', { name: 'usuários' })).toBeNull();
    expect(screen.queryByRole('tab', { name: /Atualizar dados/ })).toBeNull();
  });
});

function painelDe(turmas: Turma[], parcial: Partial<PainelDoCurso> = {}): PainelDoCurso {
  return {
    curso: curso(),
    periodoLetivo: '2026/2',
    salas: [sala('Sala 1', 0, 1), sala('Sala 2', 0, 2)],
    turmas,
    ...parcial,
  };
}

describe('Salas', () => {
  it('mostra ocupada/livre pela sobreposição real do intervalo no dia e horário escolhidos', async () => {
    const t = turma({
      sala: 'Sala 1',
      curr2023: disc('ALG', 'Algoritmos'),
      professor: 'Prof. Ana',
      horarios: [hor(2, '14:00', '16:00')],
    });
    const quartaAs14 = new Date(2026, 9, 28, 14, 30); // 28/10/2026 = quarta
    const terca = new Date(2026, 9, 27, 14, 30); // terça, 14:30
    renderizar(
      <MemoryRouter>
        <AgoraProvider fixo={terca}>
          <DicasProvider>
            <PainelDoCursoProvider painel={painelDe([t])} recarregar={async () => undefined}>
              <VisaoSalas />
            </PainelDoCursoProvider>
          </DicasProvider>
        </AgoraProvider>
      </MemoryRouter>,
    );
    const cartaoSala1 = document.querySelector('[data-room="Sala 1"]') as HTMLElement;
    const cartaoSala2 = document.querySelector('[data-room="Sala 2"]') as HTMLElement;
    expect(cartaoSala1).toHaveClass('occupied');
    expect(within(cartaoSala1).getByText('Algoritmos')).toBeInTheDocument();
    expect(cartaoSala2).toHaveClass('free');
    expect(quartaAs14.getDay()).toBe(3);

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'ocupadas');
    expect(document.querySelector('[data-room="Sala 2"]')).toBeNull();
    await userEvent.selectOptions(screen.getByLabelText('Dia'), '3');
    expect(screen.queryByText('Algoritmos')).toBeNull();
  });
});

describe('Meu plano', () => {
  const a = turma({ curr2023: disc('AAA', 'Aula A'), sala: 'Sala 1', horarios: [hor(3, '16:00', '18:00')] });
  const b = turma({ curr2023: disc('BBB', 'Aula B'), sala: 'Sala 2', horarios: [hor(3, '17:00', '19:00')] });
  const c = turma({ curr2023: disc('CCC', 'Aula C'), sala: 'Sala 2', horarios: [hor(4, '08:00', '10:00')] });
  const ori = turma({ curr2023: disc('ORI', 'Orientação'), sala: null, horarios: [] });
  const PLANO = '/api/v1/cursos/bsi/plano';

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  function montar(extra: Rota[] = [], perfil: Perfil = 'ALUNO') {
    const f = simularApi([
      (u) => (u === '/api/v1/auth/eu' ? json(200, { id: 1, login: 'ana', nome: 'Ana', perfil }) : undefined),
      ...extra,
      (u, i) =>
        u === PLANO && (i?.method ?? 'GET') === 'GET' ? json(200, { turmaIds: [], atualizadoEm: null }) : undefined,
    ]);
    renderizar(
      <MemoryRouter>
        <SessaoProvider>
          <ToastsProvider>
            <PainelDoCursoProvider painel={painelDe([a, b, c, ori])} recarregar={async () => undefined}>
              <VisaoMeuPlano />
            </PainelDoCursoProvider>
          </ToastsProvider>
        </SessaoProvider>
      </MemoryRouter>,
    );
    return f;
  }

  const houvePut = (f: ReturnType<typeof simularApi>) => f.mock.calls.some((x) => x[1]?.method === 'PUT');

  it('mostra cabeçalho, contador e catálogo; turma sem horário aparece como tal', async () => {
    montar();
    expect(await screen.findByRole('heading', { name: 'Meu plano de aulas' })).toBeInTheDocument();
    expect(screen.getByText('Quantidade de turmas')).toBeInTheDocument();
    expect(screen.getByText('turmas no plano')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ORI/ })).toHaveTextContent('Prof. Teste · sem sala · sem horário fixo');
    expect(screen.getByRole('button', { name: /AAA/ })).toHaveTextContent('QUA 16:00');
    expect(screen.getByRole('button', { name: 'Plano salvo' })).toBeDisabled();
    expect(screen.getByText(/Salve um plano para ver a semana organizada/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Filtrar turmas'), 'zzz');
    expect(screen.getByText('Nenhuma turma encontrada.')).toBeInTheDocument();
  });

  it('não adiciona turma com choque: abre o modal e "Ajustar horários" destaca as turmas', async () => {
    const f = montar();
    await userEvent.click(await screen.findByRole('button', { name: /AAA/ }));
    expect(screen.getByText('turma no plano')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /BBB/ }));
    const modal = await screen.findByRole('alertdialog', { name: 'Choque de horários' });
    expect(modal).toHaveTextContent('Não foi possível adicionar esta turma ao plano');
    expect(within(modal).getByText('Quarta-feira · 17:00–18:00')).toBeInTheDocument();
    expect(modal).toHaveTextContent('AAA — Aula A × BBB — Aula B');
    const ajustar = within(modal).getByRole('button', { name: 'Ajustar horários' });
    expect(ajustar).toHaveFocus();
    expect(screen.getByRole('button', { name: /BBB/ })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(ajustar);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    await waitFor(() => expect(document.querySelector(`.pl-item[data-rec="${b.id}"]`)).toHaveClass('flash-conflict'));
    expect(document.querySelector(`.pl-block[data-rec="${a.id}"]`)).toHaveClass('flash-conflict');
    expect(houvePut(f)).toBe(false);
  });

  it('Esc e clique no fundo fecham o modal', async () => {
    montar();
    await userEvent.click(await screen.findByRole('button', { name: /AAA/ }));
    await userEvent.click(screen.getByRole('button', { name: /BBB/ }));
    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /BBB/ }));
    await userEvent.click(document.getElementById('planConflictModal') as HTMLElement);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('salva no servidor e monta "Minha semana" com o plano salvo', async () => {
    const f = montar([
      (u, i) =>
        u === PLANO && i?.method === 'PUT'
          ? json(200, { turmaIds: JSON.parse(String(i.body)).turmaIds, atualizadoEm: '2026-10-25T10:00:00Z' })
          : undefined,
    ]);
    await userEvent.click(await screen.findByRole('button', { name: /AAA/ }));
    await userEvent.click(screen.getByRole('button', { name: /CCC/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar plano' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Plano salvo' })).toBeDisabled());
    const put = f.mock.calls.find((x) => x[1]?.method === 'PUT');
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({ turmaIds: [a.id, c.id] });
    const quarta = screen.getByRole('region', { name: 'Quarta-feira' });
    expect(quarta).toHaveTextContent('1 aula');
    expect(quarta).toHaveTextContent('16:00–18:00');
    expect(quarta).toHaveTextContent('Prof. Teste · Sala 1');
    const segunda = screen.getByRole('region', { name: 'Segunda-feira' });
    expect(segunda).toHaveClass('is-free');
    expect(segunda).toHaveTextContent('livre');
    expect(segunda).toHaveTextContent('Nenhuma aula neste dia.');
  });

  it('409 do servidor abre o mesmo modal com os choques devolvidos e não altera o plano salvo', async () => {
    montar([
      (u, i) =>
        u === PLANO && i?.method === 'PUT'
          ? json(409, {
              codigo: 'plano_com_conflito',
              detail: 'Plano recusado.',
              detalhes: [],
              conflitos: [{ dia: 4, inicio: '08:00', fim: '10:00', turmaIds: [a.id, c.id], turmas: [] }],
            })
          : undefined,
    ]);
    await userEvent.click(await screen.findByRole('button', { name: /AAA/ }));
    await userEvent.click(screen.getByRole('button', { name: /CCC/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar plano' }));
    const modal = await screen.findByRole('alertdialog');
    expect(modal).toHaveTextContent('Não foi possível salvar o plano porque existem choques de horário');
    expect(within(modal).getByText('Quinta-feira · 08:00–10:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar plano' })).toBeEnabled();
    expect(screen.getByText(/Salve um plano para ver a semana organizada/)).toBeInTheDocument();
  });

  it('erro de servidor avisa o usuário e mantém o plano salvo', async () => {
    montar([
      (u, i) =>
        u === PLANO && i?.method === 'PUT' ? json(500, { codigo: 'erro_interno', detail: 'Falhou.' }) : undefined,
    ]);
    await userEvent.click(await screen.findByRole('button', { name: /AAA/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar plano' }));
    expect(await screen.findByText('Falhou.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar plano' })).toBeEnabled();
  });

  it('não renderiza para professor', async () => {
    const f = montar([], 'PROFESSOR');
    await waitFor(() => expect(f.mock.calls.some((x) => x[0] === '/api/v1/auth/eu')).toBe(true));
    expect(screen.queryByText('Meu plano de aulas')).toBeNull();
    expect(f.mock.calls.some((x) => x[0] === PLANO)).toBe(false);
  });
});
