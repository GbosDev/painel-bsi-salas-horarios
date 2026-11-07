import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AjusteExcepcional } from '../features/atualizar-dados/components/AjusteExcepcional';
import { esquemaEdicao, esquemaNovaTurma } from '../features/atualizar-dados/types/schemas';
import { esquemaAlterarSenha } from '../features/autenticacao/types/schemas';
import { PainelDoCursoProvider, usePainelDoCurso } from '../features/cursos/hooks/PainelDoCurso';
import { Gaveta } from '../features/turmas/components/Gaveta';
import { VisaoMeuPlano } from '../features/plano/components/VisaoMeuPlano';
import type { PainelDoCurso } from '../shared/api/tipos';
import { AgoraProvider } from '../shared/contexto/Agora';
import { DicasProvider } from '../shared/contexto/Dicas';
import { Carregando, ErroComTentativa, Vazio } from '../shared/ui/Estados';
import { ToastsProvider } from '../shared/ui/Toasts';
import { renderizar } from './envoltorio';
import { curso, disc, hor, sala, turma } from './fabrica';

function json(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=teste; path=/';
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const painelDe = (turmas: ReturnType<typeof turma>[]): PainelDoCurso => ({
  curso: curso(),
  periodoLetivo: '2026/2',
  salas: [sala('Sala 1', 1, 1), sala('Sala 2', 0, 2)],
  turmas,
});

describe('esquemas Zod (espelham as regras da API)', () => {
  it('ajuste exige motivo com 8+ caracteres e aceita turma sem horário fixo', () => {
    const base = { professor: 'Ana', sala: '', vagas: 10, horarios: [], motivo: 'curto' };
    expect(esquemaEdicao.safeParse(base).success).toBe(false);
    expect(esquemaEdicao.safeParse({ ...base, motivo: 'troca de sala urgente' }).success).toBe(true);
  });

  it('horário com fim antes do início é recusado', () => {
    const r = esquemaEdicao.safeParse({
      professor: '',
      sala: '',
      vagas: 0,
      motivo: 'motivo válido',
      horarios: [{ diaSemana: 2, inicio: '16:00', fim: '15:00' }],
    });
    expect(r.success).toBe(false);
  });

  it('nova turma exige sigla e disciplina', () => {
    const r = esquemaNovaTurma.safeParse({
      sigla: '',
      disciplina: '',
      codigo: '',
      periodo: '',
      professor: '',
      sala: '',
      vagas: 0,
      horarios: [],
      motivo: 'motivo válido',
    });
    expect(r.success).toBe(false);
  });

  it('nova senha: 10+ caracteres com letras e números', () => {
    expect(esquemaAlterarSenha.safeParse({ senhaAtual: 'x', novaSenha: 'curta1' }).success).toBe(false);
    expect(esquemaAlterarSenha.safeParse({ senhaAtual: 'x', novaSenha: 'somenteletras' }).success).toBe(false);
    expect(esquemaAlterarSenha.safeParse({ senhaAtual: 'x', novaSenha: 'senha-longa-123' }).success).toBe(true);
  });
});

describe('Estados de dados (carregando, erro, vazio)', () => {
  it('erro oferece a ação de tentar de novo', async () => {
    const tentar = vi.fn();
    renderizar(<ErroComTentativa mensagem="Falha de rede" aoTentar={tentar} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(tentar).toHaveBeenCalledOnce();
  });

  it('carregando é anunciado como status e vazio orienta o próximo passo', () => {
    renderizar(
      <>
        <Carregando rotulo="Carregando painel…" />
        <Vazio titulo="Nada aqui" orientacao="Crie a primeira turma." />
      </>,
    );
    expect(screen.getByRole('status', { name: 'Carregando painel…' })).toBeInTheDocument();
    expect(screen.getByText('Crie a primeira turma.')).toBeInTheDocument();
  });
});

describe('Gaveta da turma', () => {
  function Acionador({ t }: { t: ReturnType<typeof turma> }) {
    const { abrirGaveta } = usePainelDoCurso();
    return (
      <button type="button" onClick={() => abrirGaveta(t, 'salas')}>
        abrir
      </button>
    );
  }

  async function abrir(t: ReturnType<typeof turma>) {
    renderizar(
      <MemoryRouter>
        <AgoraProvider>
          <DicasProvider>
            <PainelDoCursoProvider painel={painelDe([t])} recarregar={async () => undefined}>
              <Acionador t={t} />
              <Gaveta />
            </PainelDoCursoProvider>
          </DicasProvider>
        </AgoraProvider>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'abrir' }));
  }

  it('mostra o aviso da turma quando existe (ex.: conflito conhecido aguardando decisão)', async () => {
    await abrir(
      turma({
        aviso: 'Sala dividida com outra turma até a decisão da coordenação.',
        horarios: [hor(2, '14:00', '16:00')],
      }),
    );
    expect(screen.getByText(/Aviso sobre esta turma/)).toBeInTheDocument();
    expect(screen.getByText('Sala dividida com outra turma até a decisão da coordenação.')).toBeInTheDocument();
  });

  it('sem aviso não mostra o bloco; turma sem horário fixo é explicada', async () => {
    await abrir(turma({ aviso: null, horarios: [] }));
    expect(screen.queryByText(/Aviso sobre esta turma/)).toBeNull();
    expect(screen.getByText(/Sem horário fixo/)).toBeInTheDocument();
  });
});

describe('Meu plano — sem a caixa de quantidade de choques', () => {
  const a = turma({ curr2023: disc('AAA', 'Aula A'), horarios: [hor(3, '16:00', '18:00')] });
  const b = turma({ curr2023: disc('BBB', 'Aula B'), horarios: [hor(3, '17:00', '18:00')] });
  const orientacao = turma({ curr2023: disc('ORI', 'Orientação'), horarios: [] });

  it('mantém só o aviso de conflito e lista turmas sem horário fixo como tal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(200, { turmaIds: [], atualizadoEm: null })),
    );
    renderizar(
      <MemoryRouter>
        <AgoraProvider fixo={new Date(2026, 9, 27, 10, 0)}>
          <DicasProvider>
            <PainelDoCursoProvider painel={painelDe([a, b, orientacao])} recarregar={async () => undefined}>
              <VisaoMeuPlano />
            </PainelDoCursoProvider>
          </DicasProvider>
        </AgoraProvider>
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByRole('button', { name: /AAA/ }));
    expect(screen.queryByText(/choque\(s\) de horário/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /BBB/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('conflitos de horários');
    expect(screen.getByRole('button', { name: /ORI/ })).toHaveTextContent('sem horário fixo');
  });
});

describe('Ajuste excepcional', () => {
  const t = turma({
    curr2023: disc('AAA', 'Aula A'),
    sala: 'Sala 1',
    professor: 'Prof. Ana',
    horarios: [hor(3, '16:00', '18:00')],
  });

  function montar() {
    return renderizar(
      <MemoryRouter>
        <ToastsProvider>
          <PainelDoCursoProvider painel={painelDe([t])} recarregar={async () => undefined}>
            <AjusteExcepcional aoFechar={() => undefined} />
          </PainelDoCursoProvider>
        </ToastsProvider>
      </MemoryRouter>,
    );
  }

  it('tem as abas Turmas e Catálogo de salas e lista as turmas existentes', async () => {
    montar();
    expect(screen.getByRole('tab', { name: 'Turmas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('AAA')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Catálogo de salas' }));
    expect(screen.getByText(/Sala 1 · 1/)).toBeInTheDocument();
  });

  it('não envia sem motivo e mostra o erro ao lado do campo; com motivo, envia a edição com a versão', async () => {
    const f = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/csrf')) return json(200, {});
      if (init?.method === 'PUT')
        return json(200, { turma: t, avisos: ['Sala 1 também está em uso por outra turma nesse horário.'] });
      return json(404, { detail: 'não simulado' });
    });
    vi.stubGlobal('fetch', f);
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar ajuste' }));
    expect(await screen.findByText(/Descreva o motivo/)).toBeInTheDocument();
    expect(f.mock.calls.some((c) => c[1]?.method === 'PUT')).toBe(false);

    await userEvent.type(screen.getByLabelText(/Motivo/), 'troca de professor por afastamento');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar ajuste' }));
    await waitFor(() => expect(f.mock.calls.some((c) => c[1]?.method === 'PUT')).toBe(true));
    const put = f.mock.calls.find((c) => c[1]?.method === 'PUT');
    expect(JSON.parse(String(put?.[1]?.body))).toMatchObject({
      professor: 'Prof. Ana',
      sala: 'Sala 1',
      versao: 0,
      motivo: 'troca de professor por afastamento',
    });
  });
});
