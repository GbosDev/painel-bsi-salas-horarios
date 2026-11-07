import { useMemo, useState } from 'react';
import { aoAtivar } from '../../../shared/lib/teclado';
import { useAgora } from '../../../shared/contexto/Agora';
import { usePainelDoCurso } from '../../cursos/hooks/PainelDoCurso';
import {
  DIAS,
  DIA_LONGO,
  diaPadrao,
  formatarHora,
  inicioPadrao,
  ocupacaoDaSala,
  opcoesDeInicio,
} from '../../../shared/lib/horarios';
import { profCurto, rotuloDaTurma } from '../../../shared/lib/rotulos';
import { ChipSigla } from '../../turmas/components/ChipSigla';

type FiltroDeStatus = 'todas' | 'livres' | 'ocupadas';

export function VisaoSalas() {
  const { painel, grade, abrirGaveta } = usePainelDoCurso();
  const agora = useAgora();
  const duracao = painel.curso.duracaoAulaHoras;
  const opcoes = useMemo(() => opcoesDeInicio(painel.turmas, duracao), [painel.turmas, duracao]);
  const [dia, setDia] = useState(() => diaPadrao(agora));
  const [inicio, setInicio] = useState(() => inicioPadrao(opcoes, agora));
  const [status, setStatus] = useState<FiltroDeStatus>('todas');

  const iniMin = inicio * 60;
  const fimMin = iniMin + duracao * 60;

  function verAgora() {
    setDia(diaPadrao(agora));
    setInicio(inicioPadrao(opcoes, agora));
  }

  return (
    <section className="view active" id="view-predio">
      <div className="section-head">
        <div>
          <h2>Ocupação das salas</h2>
          <div className="desc">
            Veja, sala por sala, quem está ou não ocupando cada espaço em um dia e horário específicos.
            {painel.curso.alternaMatrizes
              ? ' Use o alternador de grade no topo da página para trocar entre 2023 e 2008.'
              : ''}
          </div>
        </div>
      </div>
      <div className="filter-bar">
        <div className="filter-field">
          <label htmlFor="f-dia">Dia</label>
          <select id="f-dia" value={dia} onChange={(e) => setDia(Number(e.target.value))}>
            {DIAS.map((d) => (
              <option key={d} value={d}>
                {DIA_LONGO[d]}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="f-hora">Horário</label>
          <select id="f-hora" value={inicio} onChange={(e) => setInicio(Number(e.target.value))}>
            {opcoes.map((h) => (
              <option key={h} value={h}>
                {formatarHora(h)} – {formatarHora(h + duracao)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="f-status">Status</label>
          <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value as FiltroDeStatus)}>
            <option value="todas">Todas as salas</option>
            <option value="livres">Só livres</option>
            <option value="ocupadas">Só ocupadas</option>
          </select>
        </div>
        <button className="filter-reset" onClick={verAgora}>
          Ver agora
        </button>
      </div>
      <div className="rooms-legend">
        <div className="legend-item">
          <span className="dot-status occupied" />
          Ocupada
        </div>
        <div className="legend-item">
          <span className="dot-status free" />
          Livre
        </div>
      </div>
      <div className="rooms-grid">
        {painel.salas.map((s) => {
          const turma = ocupacaoDaSala(painel.turmas, s.nome, dia, iniMin, fimMin);
          if (status === 'livres' && turma) return null;
          if (status === 'ocupadas' && !turma) return null;
          const rot = turma ? rotuloDaTurma(turma, grade) : null;
          return (
            <div
              key={s.id}
              className={`room-card ${turma ? 'occupied' : 'free'}`}
              data-room={s.nome}
              onClick={turma ? () => abrirGaveta(turma, 'salas') : undefined}
              role={turma ? 'button' : undefined}
              tabIndex={turma ? 0 : undefined}
              onKeyDown={turma ? aoAtivar(() => abrirGaveta(turma, 'salas')) : undefined}
            >
              <div className="room-header">
                <span className="room-title">{s.nome}</span>
                <span className="status-badge">{turma ? 'Ocupada' : 'Livre'}</span>
              </div>
              {turma && rot ? (
                <div className="class-details">
                  <div className="tags-container">
                    <ChipSigla turma={turma} grade={grade} classe="subject-abbr" />
                    {rot.codigo && <span className="subject-code">{rot.codigo}</span>}
                  </div>
                  <div className="subject-name">{rot.nome}</div>
                  <div className="info-group">
                    <span className="info-label">Professor(a): </span>
                    {profCurto(turma.professor)}
                  </div>
                </div>
              ) : (
                <div className="free-message">Disponível</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
