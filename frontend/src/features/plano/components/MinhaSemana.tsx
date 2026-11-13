import type { Turma } from '../../../shared/api/tipos';
import { COLORS, DAY_FULL, DAY_ORDER, fmtRange, nm, sessoes } from '../lib/planUtils';

interface Props {
  /** turmas do plano SALVO (não da seleção em edição), na ordem salva */
  sp: Turma[];
  saved: number[];
  slot: number;
}

/** Minha semana — grade visual do plano já salvo, um dia por coluna. */
export function MinhaSemana({ sp, saved, slot }: Props) {
  return (
    <div className="pl-agenda">
      <div className="pl-week-intro">
        <h3>Minha semana</h3>
        <p>
          Consulta rápida do plano salvo: cada coluna é um dia e cada card é uma aula, com horário, professor(a) e sala.
        </p>
      </div>
      {!sp.length ? (
        <div className="pl-week-placeholder">
          Salve um plano para ver a semana organizada, com disciplina, professor(a) e sala de cada aula.
        </div>
      ) : (
        <div className="pl-week">
          {DAY_ORDER.map((d) => {
            const items = sp
              .flatMap((r) =>
                sessoes(r)
                  .filter((s) => s.day_num === d)
                  .map((s) => ({ r, h: s.hour })),
              )
              .sort((a, b) => a.h - b.h);
            return (
              <section className={'pl-week-col' + (items.length ? '' : ' is-free')} aria-label={DAY_FULL[d]} key={d}>
                <div className="pl-week-dayhead">
                  <span className="pl-week-dayname">{(DAY_FULL[d] ?? '').replace('-feira', '')}</span>
                  <span className="pl-week-badge">
                    {items.length ? String(items.length) + (items.length === 1 ? ' aula' : ' aulas') : 'livre'}
                  </span>
                </div>
                <div className="pl-week-body">
                  {!items.length ? (
                    <div className="pl-week-empty">Nenhuma aula neste dia.</div>
                  ) : (
                    items.map((it, i) => {
                      const n = nm(it.r);
                      const idx = saved.indexOf(it.r.id);
                      const color = COLORS[(idx >= 0 ? idx : 0) % COLORS.length];
                      return (
                        <article
                          className="pl-week-card"
                          style={{ borderLeftColor: color }}
                          key={`${it.r.id}-${it.h}-${i}`}
                        >
                          <div className="pl-week-time">{fmtRange(it.h, slot)}</div>
                          <div className="pl-week-sigla">{n.sigla || '—'}</div>
                          <div className="pl-week-name">{n.nome || ''}</div>
                          <div className="pl-week-meta">
                            {(it.r.professor || 'professor não informado') + ' · ' + (it.r.sala || 'sem sala')}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
