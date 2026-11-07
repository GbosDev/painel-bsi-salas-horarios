import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PainelDoCurso as Painel, Turma } from '../../../shared/api/tipos';
import type { Grade } from '../../../shared/lib/rotulos';

/** De onde a gaveta foi aberta: a ementa só aparece a partir da grade horária e do índice de disciplinas. */
export type OrigemDaGaveta = 'grade' | 'disciplinas' | 'busca' | 'salas';

interface ValorDoPainel {
  painel: Painel;
  recarregar: () => Promise<void>;
  grade: Grade;
  definirGrade: (g: Grade) => void;
  gaveta: { turma: Turma; origem: OrigemDaGaveta } | null;
  abrirGaveta: (turma: Turma, origem: OrigemDaGaveta) => void;
  fecharGaveta: () => void;
}

const Contexto = createContext<ValorDoPainel | null>(null);

export function PainelDoCursoProvider(props: { painel: Painel; recarregar: () => Promise<void>; children: ReactNode }) {
  const { painel, recarregar, children } = props;
  const [grade, definirGrade] = useState<Grade>('2023');
  const [gaveta, setGaveta] = useState<ValorDoPainel['gaveta']>(null);
  const abrirGaveta = useCallback((turma: Turma, origem: OrigemDaGaveta) => setGaveta({ turma, origem }), []);
  const fecharGaveta = useCallback(() => setGaveta(null), []);
  const valor = useMemo(
    () => ({ painel, recarregar, grade, definirGrade, gaveta, abrirGaveta, fecharGaveta }),
    [painel, recarregar, grade, gaveta, abrirGaveta, fecharGaveta],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePainelDoCurso(): ValorDoPainel {
  const v = useContext(Contexto);
  if (!v) throw new Error('usePainelDoCurso fora do PainelDoCursoProvider');
  return v;
}
