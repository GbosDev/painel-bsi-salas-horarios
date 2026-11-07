import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Perfil, UsuarioResumo } from '../../../shared/api/tipos';
import { Carregando, ErroComTentativa, Vazio } from '../../../shared/ui/Estados';
import { useToasts } from '../../../shared/ui/Toasts';
import { useSessao } from '../../autenticacao/hooks/Sessao';
import { usuarios } from '../api/usuariosApi';
import {
  esquemaNovoUsuario,
  gerarSenhaInicial,
  normalizarMatricula,
  sugerirLogin,
  type DadosDeNovoUsuario,
} from '../types/schemas';

const CHAVE = ['usuarios'] as const;
type Filtro = 'TODOS' | Perfil;

const ROTULO_PERFIL: Record<Perfil, string> = { ALUNO: 'Estudante', PROFESSOR: 'Professor(a)' };

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? (p[p.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Conta recém-criada: mostrada uma única vez para o professor repassar ao usuário (não é guardada). */
interface ContaCriada {
  login: string;
  senha: string;
  nome: string;
  perfil: Perfil;
}

/**
 * Gestão de contas (só professor): resumo, cadastro e lista com busca e filtro.
 * Estudantes são identificados pela matrícula (que é o login) e depois pelo nome.
 * Ativar, desativar e apagar: somente a conta de administração.
 */
export function GerenciarUsuarios({ aoFechar }: { aoFechar: () => void }) {
  const cliente = useQueryClient();
  const { avisar } = useToasts();
  const { usuario: eu } = useSessao();
  const souAdministrador = !!eu?.administrador;
  const lista = useQuery({ queryKey: CHAVE, queryFn: usuarios.listar });
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [busca, setBusca] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loginEditado, setLoginEditado] = useState(false);
  const [criada, setCriada] = useState<ContaCriada | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<UsuarioResumo | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<DadosDeNovoUsuario>({
    resolver: zodResolver(esquemaNovoUsuario),
    defaultValues: { login: '', nome: '', senha: '', perfil: 'ALUNO', matricula: '' },
  });
  const perfil = useWatch({ control, name: 'perfil' });
  const matriculaDigitada = useWatch({ control, name: 'matricula' });

  const atualizarLista = () => cliente.invalidateQueries({ queryKey: CHAVE });

  const criar = useMutation({
    mutationFn: (d: DadosDeNovoUsuario) =>
      usuarios.criar(
        d.perfil === 'ALUNO'
          ? { perfil: 'ALUNO', nome: d.nome, senha: d.senha, login: null, matricula: normalizarMatricula(d.matricula) }
          : { perfil: 'PROFESSOR', nome: d.nome, senha: d.senha, login: d.login, matricula: null },
      ),
    onSuccess: async (u, d) => {
      setCriada({ login: u.login, nome: u.nome, senha: d.senha, perfil: u.perfil });
      reset({ login: '', nome: '', senha: '', perfil: d.perfil, matricula: '' });
      setLoginEditado(false);
      setMostrarSenha(false);
      avisar(`Conta de ${u.nome} criada.`);
      await atualizarLista();
    },
  });

  const alternarAtivo = useMutation({
    mutationFn: (u: UsuarioResumo) => usuarios.definirAtivo(u.id, !u.ativo),
    onSuccess: async (u) => {
      avisar(u.ativo ? `Conta de ${u.nome} reativada.` : `Conta de ${u.nome} desativada: o acesso foi encerrado.`);
      await atualizarLista();
    },
    onError: (e) => avisar(e.message, 'erro'),
  });

  const excluir = useMutation({
    mutationFn: (u: UsuarioResumo) => usuarios.excluir(u.id),
    onSuccess: async (_r, u) => {
      setConfirmarExclusao(null);
      avisar(`Conta de ${u.nome} apagada.`);
      await atualizarLista();
    },
    onError: (e) => avisar(e.message, 'erro'),
  });

  const todos = useMemo(() => lista.data ?? [], [lista.data]);
  const contagem = useMemo(
    () => ({
      total: todos.length,
      alunos: todos.filter((u) => u.perfil === 'ALUNO').length,
      professores: todos.filter((u) => u.perfil === 'PROFESSOR').length,
      inativos: todos.filter((u) => !u.ativo).length,
    }),
    [todos],
  );
  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim());
    return todos
      .filter((u) => filtro === 'TODOS' || u.perfil === filtro)
      .filter((u) => !termo || normalizar(`${u.matricula ?? ''} ${u.nome} ${u.login}`).includes(termo));
  }, [todos, filtro, busca]);

  const nomeRegistro = register('nome');
  const loginRegistro = register('login');

  return (
    <div
      className="cp-overlay exmod-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div className="exmod-card usr-card" role="dialog" aria-modal="true" aria-labelledby="usr-titulo">
        <div className="exmod-head">
          <div>
            <h3 id="usr-titulo">Usuários</h3>
            <div className="exmod-sub">
              Estudantes entram com a matrícula; professores(as), com o login.
              {souAdministrador
                ? ' Como administração, você pode ativar, desativar e apagar contas.'
                : ' Ativar, desativar e apagar contas é exclusivo da administração.'}
            </div>
          </div>
          <button type="button" className="cp-close exmod-close" onClick={aoFechar}>
            Fechar ×
          </button>
        </div>

        <div className="exmod-body usr-body">
          <div className="usr-resumo" aria-label="Resumo das contas">
            <Resumo n={contagem.total} rotulo="contas" />
            <Resumo n={contagem.alunos} rotulo="estudantes" tom="teal" />
            <Resumo n={contagem.professores} rotulo="professores(as)" tom="plum" />
            <Resumo n={contagem.inativos} rotulo="inativas" tom="rose" />
          </div>

          <div className="usr-colunas">
            {/* ---------- cadastro ---------- */}
            <form className="usr-form" onSubmit={handleSubmit((d) => criar.mutate(d))} noValidate>
              <h4>Nova conta</h4>

              <div className="usr-perfil" role="radiogroup" aria-label="Perfil">
                {(['ALUNO', 'PROFESSOR'] as const).map((p) => (
                  <label key={p} className={perfil === p ? 'ativo' : ''}>
                    <input type="radio" value={p} {...register('perfil')} />
                    {ROTULO_PERFIL[p]}
                  </label>
                ))}
              </div>

              {perfil === 'ALUNO' && (
                <Campo
                  id="u-matricula"
                  rotulo="Matrícula"
                  erro={errors.matricula?.message}
                  dica={
                    matriculaDigitada
                      ? `Login do estudante: ${normalizarMatricula(matriculaDigitada) || '—'}`
                      : 'Obrigatória. É o identificador e o login do estudante.'
                  }
                >
                  <input
                    id="u-matricula"
                    inputMode="numeric"
                    maxLength={40}
                    autoComplete="off"
                    aria-invalid={!!errors.matricula}
                    {...register('matricula')}
                  />
                </Campo>
              )}

              <Campo id="u-nome" rotulo="Nome completo" erro={errors.nome?.message}>
                <input
                  id="u-nome"
                  maxLength={150}
                  autoComplete="off"
                  aria-invalid={!!errors.nome}
                  {...nomeRegistro}
                  onChange={(e) => {
                    void nomeRegistro.onChange(e);
                    if (!loginEditado) setValue('login', sugerirLogin(e.target.value));
                  }}
                />
              </Campo>

              {perfil === 'PROFESSOR' && (
                <Campo id="u-login" rotulo="Login" erro={errors.login?.message} dica="Sugerido a partir do nome.">
                  <input
                    id="u-login"
                    maxLength={60}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={!!errors.login}
                    {...loginRegistro}
                    onChange={(e) => {
                      void loginRegistro.onChange(e);
                      setLoginEditado(e.target.value !== '');
                    }}
                  />
                </Campo>
              )}

              <Campo
                id="u-senha"
                rotulo="Senha inicial"
                erro={errors.senha?.message}
                dica="Mínimo de 10 caracteres, com letras e números. O usuário troca no primeiro acesso."
              >
                <div className="usr-senha">
                  <input
                    id="u-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="new-password"
                    spellCheck={false}
                    aria-invalid={!!errors.senha}
                    {...register('senha')}
                  />
                  <button type="button" onClick={() => setMostrarSenha((m) => !m)} aria-pressed={mostrarSenha}>
                    {mostrarSenha ? 'ocultar' : 'mostrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('senha', gerarSenhaInicial(), { shouldValidate: true });
                      setMostrarSenha(true);
                    }}
                  >
                    gerar
                  </button>
                </div>
              </Campo>

              {criar.isError && (
                <div className="auth-error" role="alert">
                  {criar.error.message}
                </div>
              )}
              <button type="submit" className="edit-save-btn usr-criar" disabled={criar.isPending}>
                {criar.isPending ? 'Criando…' : `Criar conta de ${ROTULO_PERFIL[perfil].toLowerCase()}`}
              </button>

              {criada && (
                <div className="usr-criada" role="status">
                  <b>Conta criada para {criada.nome}.</b>
                  <div>
                    {criada.perfil === 'ALUNO' ? 'Login (matrícula)' : 'Login'}: <code>{criada.login}</code>
                  </div>
                  <div>
                    Senha inicial: <code>{criada.senha}</code>
                  </div>
                  <div className="usr-acoes">
                    <button
                      type="button"
                      onClick={() =>
                        void navigator.clipboard
                          ?.writeText(`Login: ${criada.login}\nSenha inicial: ${criada.senha}`)
                          .then(() => avisar('Credenciais copiadas.'))
                      }
                    >
                      copiar
                    </button>
                    <button type="button" onClick={() => setCriada(null)}>
                      ok, já repassei
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* ---------- lista ---------- */}
            <div className="usr-lista">
              <div className="usr-ferramentas">
                <input
                  type="search"
                  placeholder="Buscar por matrícula, nome ou login…"
                  aria-label="Buscar usuários"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                <div className="usr-filtros" role="group" aria-label="Filtrar por perfil">
                  {(
                    [
                      ['TODOS', 'Todos'],
                      ['ALUNO', 'Estudantes'],
                      ['PROFESSOR', 'Professores'],
                    ] as const
                  ).map(([valor, rotulo]) => (
                    <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
                      {rotulo}
                    </button>
                  ))}
                </div>
              </div>

              {lista.isPending && <Carregando rotulo="Carregando usuários…" />}
              {lista.isError && (
                <ErroComTentativa mensagem={lista.error.message} aoTentar={() => void lista.refetch()} />
              )}
              {lista.isSuccess && visiveis.length === 0 && (
                <Vazio
                  titulo={todos.length === 0 ? 'Nenhuma conta cadastrada' : 'Nenhuma conta encontrada'}
                  orientacao={
                    todos.length === 0
                      ? 'Use o formulário ao lado para criar a primeira.'
                      : 'Ajuste a busca ou o filtro.'
                  }
                />
              )}
              {lista.isSuccess && visiveis.length > 0 && (
                <ul className="usr-itens" aria-label="Contas">
                  {visiveis.map((u) => (
                    <ItemDeUsuario
                      key={u.id}
                      u={u}
                      ehVoce={u.id === eu?.id}
                      podeGerenciar={souAdministrador && !u.administrador && u.id !== eu?.id}
                      ocupado={(alternarAtivo.isPending && alternarAtivo.variables?.id === u.id) || excluir.isPending}
                      aoAlternarAtivo={() => alternarAtivo.mutate(u)}
                      aoApagar={() => setConfirmarExclusao(u)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {confirmarExclusao && (
          <div className="usr-confirmar" role="alertdialog" aria-modal="true" aria-labelledby="usr-conf-titulo">
            <div className="usr-confirmar-card">
              <h4 id="usr-conf-titulo">Apagar a conta de {confirmarExclusao.nome}?</h4>
              <p>
                A conta <code>{confirmarExclusao.login}</code> deixa de existir e o acesso é encerrado na hora.
                {confirmarExclusao.perfil === 'ALUNO' && ' O plano de aulas do estudante também é apagado.'} O histórico
                de alterações é mantido com o nome do autor. <b>Não dá para desfazer</b> — se for temporário, prefira
                desativar.
              </p>
              <div className="usr-acoes">
                <button type="button" onClick={() => setConfirmarExclusao(null)} disabled={excluir.isPending}>
                  cancelar
                </button>
                <button
                  type="button"
                  className="perigo"
                  onClick={() => excluir.mutate(confirmarExclusao)}
                  disabled={excluir.isPending}
                >
                  {excluir.isPending ? 'apagando…' : 'apagar conta'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Resumo({ n, rotulo, tom }: { n: number; rotulo: string; tom?: 'teal' | 'plum' | 'rose' }) {
  return (
    <div className={`usr-resumo-item${tom ? ` ${tom}` : ''}`}>
      <span className="n">{n}</span>
      <span className="lbl">{rotulo}</span>
    </div>
  );
}

function Campo({
  id,
  rotulo,
  erro,
  dica,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  children: ReactNode;
}) {
  return (
    <div className="usr-campo">
      <label htmlFor={id}>{rotulo}</label>
      {children}
      {erro ? <div className="campo-erro">{erro}</div> : dica && <div className="usr-dica">{dica}</div>}
    </div>
  );
}

function ItemDeUsuario({
  u,
  ehVoce,
  podeGerenciar,
  ocupado,
  aoAlternarAtivo,
  aoApagar,
}: {
  u: UsuarioResumo;
  ehVoce: boolean;
  podeGerenciar: boolean;
  ocupado: boolean;
  aoAlternarAtivo: () => void;
  aoApagar: () => void;
}) {
  const aluno = u.perfil === 'ALUNO';
  const tom = aluno ? 'teal' : 'plum';
  return (
    <li className={`usr-item${u.ativo ? '' : ' inativo'}`}>
      <span className={`usr-avatar ${tom}`} aria-hidden="true">
        {iniciais(u.nome)}
      </span>
      <div className="usr-ident">
        {aluno && u.matricula ? (
          <>
            <div className="usr-nome">
              <span className="usr-matricula">{u.matricula}</span> {u.nome}
            </div>
            <div className="usr-meta">matrícula · login</div>
          </>
        ) : (
          <>
            <div className="usr-nome">{u.nome}</div>
            <div className="usr-meta">
              <code>{u.login}</code>
              {u.matricula && <span>· matrícula {u.matricula}</span>}
            </div>
          </>
        )}
      </div>
      <div className="usr-tags">
        <span className={`usr-badge ${tom}`}>{ROTULO_PERFIL[u.perfil]}</span>
        {u.administrador && <span className="usr-badge admin">Administração</span>}
        {ehVoce && <span className="usr-badge voce">Você</span>}
        <span className={`usr-status${u.ativo ? ' ativo' : ''}`}>{u.ativo ? 'ativa' : 'inativa'}</span>
      </div>
      {podeGerenciar && (
        <div className="usr-gerenciar">
          <button type="button" onClick={aoAlternarAtivo} disabled={ocupado}>
            {u.ativo ? 'desativar' : 'reativar'}
          </button>
          <button type="button" className="perigo" onClick={aoApagar} disabled={ocupado}>
            apagar
          </button>
        </div>
      )}
    </li>
  );
}
