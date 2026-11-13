import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { choqueRotulo, names, type Choque } from '../lib/planUtils';

interface Props {
  conflicts: Choque[];
  lead: string;
  onClose: () => void;
  onAdjust: () => void;
}

export function PlanConflictModal({ conflicts, lead, onClose, onAdjust }: Props) {
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    btn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Esc fecha (listener acima); o clique é só no fundo
    <div
      id="planConflictModal"
      className="cp-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="plan-modal" role="alertdialog" aria-modal="true" aria-labelledby="planConflictTitle">
        <h3 id="planConflictTitle">Choque de horários</h3>
        <p>{lead}</p>
        <div className="plan-modal-list">
          {conflicts.map((c) => (
            <div className="plan-modal-item" key={`${c.day}-${c.hour}-${c.recs[0].id}-${c.recs[1].id}`}>
              <b>{choqueRotulo(c)}</b>
              <span>{names(c)}</span>
            </div>
          ))}
        </div>
        <button type="button" className="edit-save-btn" ref={btn} onClick={onAdjust}>
          Ajustar horários
        </button>
      </div>
    </div>,
    document.body,
  );
}
