import { useEffect, useRef, useState, type ReactNode } from 'react';
import { aoAtivar } from '../../shared/lib/teclado';
import type { Curso, Turma } from '../../shared/api/tipos';
import { useAgora } from '../../shared/contexto/Agora';
import { buscarTurmas, type ResultadoDeBusca } from '../../shared/lib/busca';
import { horariosEmTexto, relogioTexto, turmaEmAula } from '../../shared/lib/horarios';
import { profCurto, rotuloDaTurma, type Grade } from '../../shared/lib/rotulos';
import { ChipSigla } from '../../features/turmas/components/ChipSigla';

function ListaAgora({ turmas, grade }: { turmas: Turma[]; grade: Grade }) {
  const agora = useAgora();
  const emAula = turmas.filter((t) => turmaEmAula(t, agora));
  if (!emAula.length) return <div className="now-empty">Nenhuma aula agora. Confira a grade horária completa.</div>;
  return (
    <>
      {emAula.map((t) => (
        <div className="now-row" key={t.id}>
          <ChipSigla turma={t} grade={grade} />
          <span>{profCurto(t.professor)}</span>
          <span className="rm">{t.sala || '—'}</span>
        </div>
      ))}
    </>
  );
}

function Meta({ r, curso }: { r: ResultadoDeBusca; curso: Curso }) {
  const t = r.turma;
  const horarios = t.horarios.length ? horariosEmTexto(t).replace(/ · /g, ', ') : 'sem horário fixo';
  const sigla = t.curr2023?.sigla ?? t.curr2008?.sigla ?? '—';
  const prof = t.professor || 'professor não informado';
  const segs: { t: string; hl?: boolean }[] =
    r.tipo === 'professor'
      ? [{ t: t.professor || '—', hl: true }, { t: horarios }, { t: t.sala || 'sem sala' }]
      : r.tipo === 'sala'
        ? [{ t: `Sala ${t.sala ?? '—'}`, hl: true }, { t: prof }, { t: horarios }]
        : r.tipo === 'sigla'
          ? [{ t: sigla, hl: true }, { t: prof }, { t: horarios }]
          : [{ t: prof }, { t: horarios }, { t: t.sala || 'sem sala' }];
  segs.push({ t: curso.sigla });
  const nos: ReactNode[] = [];
  segs.forEach((s, i) => {
    if (i) nos.push(' · ');
    nos.push(s.hl ? <b key={i}>{s.t}</b> : <span key={i}>{s.t}</span>);
  });
  return <span className="meta">{nos}</span>;
}

function BuscaPrincipal(props: { turmas: Turma[]; curso: Curso; grade: Grade; aoEscolher: (t: Turma) => void }) {
  const { turmas, curso, grade, aoEscolher } = props;
  const [q, setQ] = useState('');
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const resultados = buscarTurmas(turmas, q);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('click', fora);
    return () => document.removeEventListener('click', fora);
  }, []);

  const termo = q.trim();
  return (
    <div className="hero-search-big" ref={raiz}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="text"
        aria-label="Buscar disciplina, professor ou sala"
        placeholder="Sigla, disciplina, professor ou sala…"
        autoComplete="off"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
      />
      <div className={`hero-search-results${aberto && (resultados.length > 0 || termo.length >= 2) ? ' open' : ''}`}>
        {resultados.length === 0 && termo.length >= 2 && (
          <div className="hsr-empty">Nenhum resultado para "{termo}" neste curso.</div>
        )}
        {resultados.map((r) => {
          const rot = rotuloDaTurma(r.turma, grade);
          return (
            <div
              className="hsr-item"
              key={r.turma.id}
              role="button"
              tabIndex={0}
              onKeyDown={aoAtivar(() => {
                setAberto(false);
                setQ('');
                aoEscolher(r.turma);
              })}
              onClick={() => {
                setAberto(false);
                setQ('');
                aoEscolher(r.turma);
              }}
            >
              <ChipSigla turma={r.turma} grade={grade} />
              <div className="hsr-info">
                <span className="nm">{rot.nome}</span>
                <Meta r={r} curso={curso} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  curso: Curso;
  periodoLetivo: string;
  turmas: Turma[];
  grade: Grade;
  aoEscolherNaBusca: (t: Turma) => void;
}

export function Hero({ curso, periodoLetivo, turmas, grade, aoEscolherNaBusca }: Props) {
  const agora = useAgora();
  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span>
              {curso.centro.sigla} · {curso.sigla} · {periodoLetivo}
            </span>
            <span className="clock">{relogioTexto(agora)}</span>
          </div>
          {/* título sempre em uma linha (como no BSI): o tamanho acompanha a largura e o nome longo não quebra */}
          <h1 className="hero-titulo" title={`Painel ${curso.centro.sigla} · ${curso.nome}`}>
            Painel {curso.centro.sigla} <em>{curso.nome}</em>
          </h1>
          <div className="hero-linha">
            <p className="lead">
              Disciplinas, salas e horários das grades atual e antiga em um só lugar — e o que está acontecendo agora.
            </p>
            <BuscaPrincipal turmas={turmas} curso={curso} grade={grade} aoEscolher={aoEscolherNaBusca} />
          </div>
        </div>
        <div className="now-card">
          <div className="lbl">
            <span className="pulse" /> ACONTECENDO AGORA
          </div>
          <div className="now-list">
            <ListaAgora turmas={turmas} grade={grade} />
          </div>
        </div>
      </div>
    </section>
  );
}
