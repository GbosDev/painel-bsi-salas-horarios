import { choqueRotulo, names, type Choque } from '../lib/planUtils';

/** Aviso fixo (sem popup) para o caso raro de um plano já salvo entrar em choque depois que um professor altera o horário de uma turma. */
export function PlanConflictBanner({ conflictList }: { conflictList: Choque[] }) {
  if (!conflictList.length) return null;
  return (
    <div className="plan-error" role="alert">
      <div className="plan-error-title">Existem conflitos de horário entre as turmas selecionadas.</div>
      <div className="plan-error-sub">Desmarque ou troque uma das turmas indicadas antes de salvar o plano.</div>
      <div className="plan-error-list">
        {conflictList.map((c) => (
          <div className="plan-error-item" key={`${c.day}-${c.hour}-${c.recs[0].id}-${c.recs[1].id}`}>
            <b>{choqueRotulo(c)}</b>
            {': ' + names(c)}
          </div>
        ))}
      </div>
    </div>
  );
}
