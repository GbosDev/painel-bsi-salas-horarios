import type { Turma } from '../../../shared/api/tipos';
import { useDicas } from '../../../shared/contexto/Dicas';
import { rotuloDaTurma, type Grade } from '../../../shared/lib/rotulos';

export function DicaDeSigla({ turma, grade }: { turma: Turma; grade: Grade }) {
  const c23 = turma.curr2023;
  const c08 = turma.curr2008;
  if (grade === '2023' && c23) {
    return (
      <>
        <b>{c23.sigla}</b> — {c23.nome}
        <div className="tt-sub">
          {c08 ? `Grade 2008: ${c08.sigla} · ${c08.nome}` : 'Sem correspondente na grade 2008'}
        </div>
      </>
    );
  }
  if (grade === '2008' && c08) {
    return (
      <>
        <b>{c08.sigla}</b> — {c08.nome}
        <div className="tt-sub">{c23 ? `Grade 2023: ${c23.sigla} · ${c23.nome}` : 'Fora de oferta na grade 2023'}</div>
      </>
    );
  }
  const d = c23 ?? c08;
  return (
    <>
      <b>{d?.sigla ?? '—'}</b> — {d?.nome ?? ''}
    </>
  );
}

/** Sigla colorida pela grade, com tooltip mostrando a correspondência entre as matrizes. */
export function ChipSigla({ turma, grade, classe = 'sigla-chip' }: { turma: Turma; grade: Grade; classe?: string }) {
  const { mostrar, esconder } = useDicas();
  const r = rotuloDaTurma(turma, grade);
  const dot = classe === 'sigla-chip';
  return (
    <span
      className={`${classe} g${r.grade}`}
      onMouseEnter={(e) => mostrar(e.currentTarget, <DicaDeSigla turma={turma} grade={r.grade} />)}
      onMouseLeave={esconder}
    >
      {dot && <span className={`grade-dot g${r.grade}`} />}
      {r.sigla}
    </span>
  );
}
