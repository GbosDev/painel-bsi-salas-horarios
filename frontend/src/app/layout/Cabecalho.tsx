import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Curso, Perfil } from '../../shared/api/tipos';
import { useCursos } from '../../features/cursos/hooks/useCursos';
import { useSessao } from '../../features/autenticacao/hooks/Sessao';
import type { Grade } from '../../shared/lib/rotulos';
import { AlterarSenha } from '../../features/autenticacao/components/AlterarSenha';
import { GerenciarUsuarios } from '../../features/usuarios/components/GerenciarUsuarios';

export interface AbaDef {
  id: string;
  numero: string;
  rotulo: string;
}

export function abasDoPerfil(perfil: Perfil): AbaDef[] {
  const comuns: AbaDef[] = [
    { id: 'predio', numero: '01', rotulo: 'Salas' },
    { id: 'grade', numero: '02', rotulo: 'Grade horária' },
    { id: 'disciplinas', numero: '03', rotulo: 'Disciplinas' },
  ];
  if (perfil === 'ALUNO') return [...comuns, { id: 'plano', numero: '04', rotulo: 'Meu plano' }];
  return [
    ...comuns,
    { id: 'painel', numero: '04', rotulo: 'Painel' },
    { id: 'csv', numero: '05', rotulo: 'Atualizar dados' },
    { id: 'historico', numero: '06', rotulo: 'Histórico' },
  ];
}

/** Itens do seletor: cursos soltos e centros com vários cursos agrupados (ex.: Instituto de Biociências). */
type ItemDoSeletor =
  { tipo: 'curso'; curso: Curso } | { tipo: 'grupo'; sigla: string; nome: string; descricao: string; cursos: Curso[] };

export function montarItensDoSeletor(cursos: Curso[]): ItemDoSeletor[] {
  const porCentro = new Map<string, Curso[]>();
  for (const c of cursos) porCentro.set(c.centro.sigla, [...(porCentro.get(c.centro.sigla) ?? []), c]);
  const itens: ItemDoSeletor[] = [];
  const grupoJaAdicionado = new Set<string>();
  for (const c of cursos) {
    const irmaos = porCentro.get(c.centro.sigla) ?? [];
    if (c.centro.descricao && irmaos.length > 1) {
      if (grupoJaAdicionado.has(c.centro.sigla)) continue;
      grupoJaAdicionado.add(c.centro.sigla);
      itens.push({
        tipo: 'grupo',
        sigla: c.centro.sigla,
        nome: c.centro.nome,
        descricao: c.centro.descricao,
        cursos: irmaos,
      });
    } else {
      itens.push({ tipo: 'curso', curso: c });
    }
  }
  return itens;
}

function SeletorDeCurso({ codigoAtual, aba }: { codigoAtual: string; aba: string }) {
  const { cursos } = useCursos();
  const navegar = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const itens = useMemo(() => montarItensDoSeletor(cursos), [cursos]);
  const atual = cursos.find((c) => c.codigo === codigoAtual);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('click', fora);
    return () => document.removeEventListener('click', fora);
  }, []);

  const ir = (codigo: string) => {
    setAberto(false);
    setGrupoAberto(null);
    navegar(`/curso/${codigo}/${aba}`);
  };
  const grupo = itens.find((i) => i.tipo === 'grupo' && i.sigla === grupoAberto);

  return (
    <div className="course-switcher" ref={raiz}>
      <button
        className="course-grid-btn"
        aria-haspopup="true"
        aria-expanded={aberto}
        title="Trocar de curso"
        onClick={() => setAberto((a) => !a)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </button>
      <div className={`course-dropdown${aberto ? ' open' : ''}`}>
        {itens.map((item) =>
          item.tipo === 'curso' ? (
            <a
              key={item.curso.codigo}
              href={`/curso/${item.curso.codigo}/${aba}`}
              className={`cd-item${item.curso.codigo === codigoAtual ? ' active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                ir(item.curso.codigo);
              }}
            >
              <div className="cd-top">
                <span className="cd-sigla">{item.curso.sigla}</span>
                <span className={`cd-status ${item.curso.situacao}`}>
                  {item.curso.situacao === 'completo' ? 'Completo' : 'Escopo'}
                </span>
              </div>
              <div className="cd-nome">{item.curso.nome}</div>
            </a>
          ) : (
            <button
              type="button"
              key={item.sigla}
              className={`cd-item${atual?.centro.sigla === item.sigla ? ' active' : ''}`}
              onClick={() => {
                setAberto(false);
                setGrupoAberto(item.sigla);
              }}
            >
              <div className="cd-top">
                <span className="cd-sigla">{item.sigla}</span>
                <span className="cd-status completo">{item.cursos.length} cursos</span>
              </div>
              <div className="cd-nome">{item.nome}</div>
            </button>
          ),
        )}
      </div>
      {grupo && grupo.tipo === 'grupo' && (
        <div
          className="cp-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGrupoAberto(null);
          }}
        >
          <div className="cp-card" role="dialog" aria-label={grupo.nome}>
            <h3>{grupo.nome}</h3>
            <p>{grupo.descricao}:</p>
            {grupo.cursos.map((c) => (
              <a
                key={c.codigo}
                href={`/curso/${c.codigo}/${aba}`}
                className={`cp-opt${c.codigo === codigoAtual ? ' active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  ir(c.codigo);
                }}
              >
                <b>{c.sigla}</b>
                <span>{c.nome}</span>
              </a>
            ))}
            <button type="button" className="cp-close" onClick={() => setGrupoAberto(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  codigoAtual: string;
  aba: string;
  mostrarGrade: boolean;
  grade: Grade;
  aoMudarGrade: (g: Grade) => void;
  aoMudarAba: (id: string) => void;
}

export function Cabecalho({ codigoAtual, aba, mostrarGrade, grade, aoMudarGrade, aoMudarAba }: Props) {
  const { usuario, sair } = useSessao();
  const [modal, setModal] = useState<'senha' | 'usuarios' | null>(null);
  if (!usuario) return null;
  const abas = abasDoPerfil(usuario.perfil);
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <div className="brand-group">
          <span className="wordmark">
            <img className="marca-unirio" src="/marca/unirio.png" alt="UNIRIO" width={79} height={26} />
            <span className="wordmark-sep" aria-hidden="true" />
            Painel de Salas
          </span>
          <SeletorDeCurso codigoAtual={codigoAtual} aba={aba} />
        </div>
        <div className="header-controls">
          {mostrarGrade && (
            <div className="grade-toggle" role="group" aria-label="Grade curricular exibida">
              <button className="g2023" aria-pressed={grade === '2023'} onClick={() => aoMudarGrade('2023')}>
                Grade 2023
              </button>
              <button className="g2008" aria-pressed={grade === '2008'} onClick={() => aoMudarGrade('2008')}>
                Grade 2008
              </button>
            </div>
          )}
          <div className="user-badge">
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'rgba(246,243,236,.8)', margin: '0 4px' }}>
              {usuario.perfil === 'ALUNO' && usuario.matricula
                ? `${usuario.matricula} · ${usuario.nome}`
                : usuario.nome}
            </span>
            <span className={`role-badge ${usuario.perfil === 'PROFESSOR' ? 'professor' : 'aluno'}`}>
              {usuario.perfil === 'PROFESSOR' ? 'Professor(a)' : 'Estudante'}
            </span>
            {usuario.perfil === 'PROFESSOR' && (
              <BotaoDeTexto onClick={() => setModal('usuarios')}>usuários</BotaoDeTexto>
            )}
            <BotaoDeTexto onClick={() => setModal('senha')}>senha</BotaoDeTexto>
            <BotaoDeTexto onClick={() => void sair()}>sair</BotaoDeTexto>
          </div>
        </div>
      </div>
      <div className="wrap header-tabsrow">
        <div className="tabs" role="tablist" aria-label="Seções do painel">
          {abas.map((a) => (
            <button
              key={a.id}
              className="tab-btn"
              role="tab"
              data-tab={a.id}
              aria-selected={a.id === aba}
              onClick={() => aoMudarAba(a.id)}
            >
              <span className="num">{a.numero}</span>
              {a.rotulo}
            </button>
          ))}
        </div>
      </div>
      {modal === 'senha' && <AlterarSenha aoFechar={() => setModal(null)} />}
      {modal === 'usuarios' && <GerenciarUsuarios aoFechar={() => setModal(null)} />}
    </header>
  );
}

function BotaoDeTexto({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: 'rgba(246,243,236,.5)',
        fontSize: '11.5px',
        fontWeight: 700,
        cursor: 'pointer',
        textDecoration: 'underline',
        marginLeft: 6,
      }}
    >
      {children}
    </button>
  );
}
