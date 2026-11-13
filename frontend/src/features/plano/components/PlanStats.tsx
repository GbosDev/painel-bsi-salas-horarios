export function PlanStats({ turmaCount }: { turmaCount: number }) {
  return (
    <div className="plan-stats">
      <article className="plan-stat">
        <div className="plan-stat-kicker">Quantidade de turmas</div>
        <div className="plan-stat-n">{String(turmaCount)}</div>
        <div className="plan-stat-lbl">{turmaCount === 1 ? 'turma no plano' : 'turmas no plano'}</div>
        <div className="plan-stat-hint">Disciplinas marcadas nesta seleção</div>
      </article>
    </div>
  );
}
