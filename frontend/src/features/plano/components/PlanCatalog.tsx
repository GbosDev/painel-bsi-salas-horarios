import type { Turma } from '../../../shared/api/tipos';
import { fmtHour, nm, sessoes } from '../lib/planUtils';

interface Props {
  turmas: Turma[];
  sel: number[];
  q: string;
  flashIds: Set<number>;
  onQ: (q: string) => void;
  onToggle: (t: Turma) => void;
}

export function PlanCatalog({ turmas, sel, q, flashIds, onQ, onToggle }: Props) {
  const t = q.toLowerCase();
  const visiveis = turmas.filter((r) => {
    const n = nm(r);
    return !t || ((n.sigla ?? '') + ' ' + (n.nome ?? '') + ' ' + (r.professor || '')).toLowerCase().indexOf(t) >= 0;
  });
  return (
    <div className="pl-cat">
      <input
        type="search"
        placeholder="Filtrar por sigla, disciplina ou professor"
        value={q}
        aria-label="Filtrar turmas"
        onChange={(e) => onQ(e.target.value)}
      />
      <div className="pl-list">
        {visiveis.map((r) => {
          const n = nm(r);
          const on = sel.indexOf(r.id) >= 0;
          const horarios = sessoes(r)
            .map((s) => s.day_short + ' ' + fmtHour(s.hour))
            .join(', ');
          return (
            <button
              type="button"
              key={r.id}
              className={'pl-item' + (on ? ' on' : '') + (flashIds.has(r.id) ? ' flash-conflict' : '')}
              data-rec={String(r.id)}
              aria-pressed={on}
              onClick={() => onToggle(r)}
            >
              <b>{n.sigla || '—'}</b>
              <span>{n.nome || ''}</span>
              <small>
                {(r.professor || '') + ' · ' + (r.sala || 'sem sala') + ' · ' + (horarios || 'sem horário fixo')}
              </small>
            </button>
          );
        })}
        {visiveis.length === 0 && (
          <div className="rd-empty" style={{ padding: '12px 4px' }}>
            Nenhuma turma encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
