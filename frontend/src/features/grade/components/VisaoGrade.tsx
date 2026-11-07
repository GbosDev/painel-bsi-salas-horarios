import { useMemo, useState } from 'react';
import { aoAtivar } from '../../../shared/lib/teclado';
import { useAgora } from '../../../shared/contexto/Agora';
import { useDicas } from '../../../shared/contexto/Dicas';
import { usePainelDoCurso } from '../../cursos/hooks/PainelDoCurso';
import { textoDaTurma } from '../../../shared/lib/busca';
import {
  DIAS,
  DIA_CURTO,
  DIA_LONGO,
  formatarHora,
  horarioEmAula,
  opcoesDeInicio,
  paraMinutos,
} from '../../../shared/lib/horarios';
import { profCurto, rotuloDaTurma } from '../../../shared/lib/rotulos';
import type { Turma } from '../../../shared/api/tipos';

const TURNOS = ['Tarde (14–18h)', 'Noite (18–22h)', 'Manhã (8–10h)'];

function passaNoTurno(t: Turma, turno: string): boolean {
  return t.horarios.some((h) => {
    const hora = Math.floor(paraMinutos(h.inicio) / 60);
    if (turno.startsWith('Tarde')) return hora >= 13 && hora < 18;
    if (turno.startsWith('Noite')) return hora >= 18;
    if (turno.startsWith('Manhã')) return hora < 13;
    return true;
  });
}

export function VisaoGrade() {
  const { painel, grade, abrirGaveta } = usePainelDoCurso();
  const agora = useAgora();
  const { mostrar, esconder } = useDicas();
  const [sala, setSala] = useState('');
  const [professor, setProfessor] = useState('');
  const [turno, setTurno] = useState('');
  const [q, setQ] = useState('');
  // Em telas estreitas a grade mostra um dia por vez (o CSS usa data-sel-day); o padrão é o dia de hoje.
  const [diaMovel, setDiaMovel] = useState<number>(agora.dia >= 1 && agora.dia <= 6 ? agora.dia : 1);

  const salas = useMemo(
    () =>
      [...new Set(painel.turmas.map((t) => t.sala).filter((s): s is string => !!s))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    [painel.turmas],
  );
  const professores = useMemo(
    () =>
      [...new Set(painel.turmas.map((t) => t.professor).filter((s): s is string => !!s))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    [painel.turmas],
  );
  const horas = useMemo(
    () => opcoesDeInicio(painel.turmas, painel.curso.duracaoAulaHoras),
    [painel.turmas, painel.curso.duracaoAulaHoras],
  );

  const filtradas = painel.turmas.filter((t) => {
    if (sala && t.sala !== sala) return false;
    if (professor && t.professor !== professor) return false;
    if (turno && !passaNoTurno(t, turno)) return false;
    if (q && !textoDaTurma(t).includes(q.toLowerCase())) return false;
    return true;
  });

  const limpar = () => {
    setSala('');
    setProfessor('');
    setTurno('');
    setQ('');
  };

  return (
    <section className="view active" id="view-grade">
      <div className="section-head">
        <div>
          <h2>Grade horária semanal</h2>
          <div className="desc">
            Mural com todas as aulas da semana. Passe o mouse sobre a sigla para ver o nome completo da disciplina.
          </div>
        </div>
      </div>
      <div className="filter-bar">
        <div className="filter-field">
          <label htmlFor="g-sala">Sala</label>
          <select id="g-sala" value={sala} onChange={(e) => setSala(e.target.value)}>
            <option value="">Todas as salas</option>
            {salas.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="g-prof">Professor</label>
          <select id="g-prof" value={professor} onChange={(e) => setProfessor(e.target.value)}>
            <option value="">Todos os professores</option>
            {professores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="g-turno">Turno</label>
          <select id="g-turno" value={turno} onChange={(e) => setTurno(e.target.value)}>
            <option value="">Todos os turnos</option>
            {TURNOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="g-q">Buscar</label>
          <input
            id="g-q"
            type="text"
            placeholder="sigla, disciplina, sala…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className="filter-reset" onClick={limpar}>
          Limpar filtros
        </button>
      </div>
      <div className="day-switch" role="group" aria-label="Escolher o dia da semana">
        {DIAS.map((d) => (
          <button
            key={d}
            type="button"
            className={`day-chip${d === diaMovel ? ' on' : ''}`}
            aria-pressed={d === diaMovel}
            aria-label={DIA_LONGO[d]}
            onClick={() => setDiaMovel(d)}
          >
            {DIA_CURTO[d]}
            {d === agora.dia && <i className="day-dot" title="hoje" />}
          </button>
        ))}
      </div>
      <div className="schedule-board">
        <div className="sb-grid" data-sel-day={diaMovel}>
          <div className="sb-head corner">Horário</div>
          {DIAS.map((d) => (
            <div className="sb-head" data-day={d} key={d}>
              <span className="d-full">{DIA_LONGO[d]}</span>
              {d === agora.dia && <span className="today-mark">HOJE</span>}
            </div>
          ))}
          {horas.map((hora) => {
            const linhaVaziaNoDia = !filtradas.some((t) =>
              t.horarios.some((h) => h.diaSemana === diaMovel && Math.floor(paraMinutos(h.inicio) / 60) === hora),
            );
            return (
              <GradeLinha key={hora} hora={hora} vaziaNoCelular={linhaVaziaNoDia}>
                {DIAS.map((dia) => (
                  <div className={`sb-cell${linhaVaziaNoDia ? ' m-empty' : ''}`} data-day={dia} key={dia}>
                    {filtradas.flatMap((t) =>
                      t.horarios
                        .filter((h) => h.diaSemana === dia && Math.floor(paraMinutos(h.inicio) / 60) === hora)
                        .map((h, i) => {
                          const rot = rotuloDaTurma(t, grade);
                          return (
                            <div
                              key={`${t.id}-${i}`}
                              className={`class-block grade${rot.grade}${horarioEmAula(h, agora) ? ' is-now' : ''}`}
                              role="button"
                              tabIndex={0}
                              aria-label={`${rot.sigla} — detalhes da turma`}
                              onKeyDown={aoAtivar(() => abrirGaveta(t, 'grade'))}
                              onClick={() => abrirGaveta(t, 'grade')}
                              onMouseEnter={(e) =>
                                mostrar(
                                  e.currentTarget,
                                  <>
                                    <b>{rot.nome}</b>
                                    <div className="tt-sub">
                                      {profCurto(t.professor)} · {t.sala || 'sem sala'}
                                    </div>
                                  </>,
                                )
                              }
                              onMouseLeave={esconder}
                            >
                              <div className="cb-title">{rot.sigla}</div>
                              <div className="cb-meta">
                                {t.sala || 'sem sala'} · {profCurto(t.professor)}
                              </div>
                            </div>
                          );
                        }),
                    )}
                  </div>
                ))}
              </GradeLinha>
            );
          })}
          {!filtradas.some((t) => t.horarios.some((h) => h.diaSemana === diaMovel)) && (
            <div className="sb-empty-m">Nenhuma aula neste dia com os filtros atuais.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function GradeLinha({
  hora,
  vaziaNoCelular,
  children,
}: {
  hora: number;
  vaziaNoCelular: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className={`sb-cell hourcol${vaziaNoCelular ? ' m-empty' : ''}`}>{formatarHora(hora)}</div>
      {children}
    </>
  );
}
