import { forwardRef } from 'react';
import type { Turma } from '../../../shared/api/tipos';
import { COLORS, DAY_ORDER, DAY_SHORT, fmtHour, nm, sessoes } from '../lib/planUtils';

interface Props {
  picks: Turma[];
  sel: number[];
  hours: number[];
  cellClash: Set<string>;
  flashIds: Set<number>;
  canAttempt: boolean;
  saving: boolean;
  onSave: () => void;
}

/** `.pl-main`: barra com o botão salvar + grade semanal da seleção atual. O ref aponta para `.pl-main` ("Ajustar horários"). */
export const PlanGrid = forwardRef<HTMLDivElement, Props>(function PlanGrid(
  { picks, sel, hours, cellClash, flashIds, canAttempt, saving, onSave },
  ref,
) {
  return (
    <div className="pl-main" ref={ref}>
      <div className="pl-bar">
        <button type="button" className="edit-save-btn" disabled={!canAttempt || saving} onClick={onSave}>
          {canAttempt ? 'Salvar plano' : 'Plano salvo'}
        </button>
      </div>
      <div className="pl-gridwrap">
        <div className="pl-grid">
          <div />
          {DAY_ORDER.map((d) => (
            <div className="pl-dh" key={d}>
              {DAY_SHORT[d]}
            </div>
          ))}
          {hours.flatMap((h) => [
            <div className="pl-hh" key={`h${h}`}>
              {fmtHour(h)}
            </div>,
            ...DAY_ORDER.map((d) => (
              <div className={'pl-cell' + (cellClash.has(d + '-' + h) ? ' clash' : '')} key={`${d}-${h}`}>
                {picks
                  .filter((r) => sessoes(r).some((s) => s.day_num === d && s.hour === h))
                  .map((r) => (
                    <div
                      key={r.id}
                      className={'pl-block' + (flashIds.has(r.id) ? ' flash-conflict' : '')}
                      data-rec={String(r.id)}
                      style={{ background: COLORS[sel.indexOf(r.id) % COLORS.length] }}
                    >
                      <b>{nm(r).sigla}</b>
                      <span>{r.sala || 'sem sala'}</span>
                    </div>
                  ))}
              </div>
            )),
          ])}
        </div>
      </div>
    </div>
  );
});
