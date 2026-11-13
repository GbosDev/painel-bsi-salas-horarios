import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErroDeApi } from '../../../shared/api/cliente';
import type { Turma } from '../../../shared/api/tipos';
import { Carregando, ErroComTentativa } from '../../../shared/ui/Estados';
import { useToasts } from '../../../shared/ui/Toasts';
import { useSessao } from '../../autenticacao/hooks/Sessao';
import { usePainelDoCurso } from '../../cursos/hooks/PainelDoCurso';
import { plano as apiPlano } from '../api/planoApi';
import { chosen, conflictCellKeys, conflictIds, findConflicts, getHours, getSlot, type Choque } from '../lib/planUtils';
import { MinhaSemana } from './MinhaSemana';
import { PlanCatalog } from './PlanCatalog';
import { PlanConflictBanner } from './PlanConflictBanner';
import { PlanConflictModal } from './PlanConflictModal';
import { PlanGrid } from './PlanGrid';
import { PlanStats } from './PlanStats';
import './MeuPlano.css';

const LEAD_ADICIONAR =
  'Não foi possível adicionar esta turma ao plano porque o horário conflita com outra disciplina já escolhida. Desmarque uma das duas para continuar.';
const LEAD_SALVAR =
  'Não foi possível salvar o plano porque existem choques de horário entre as turmas. Desmarque uma das turmas indicadas e tente novamente.';
const SEM_IDS: number[] = [];

/** Aba "Meu plano": só para ALUNO logado (a aba também some do cabeçalho e a rota redireciona — ver abasDoPerfil/Casca). */
export function VisaoMeuPlano() {
  const { usuario } = useSessao();
  if (!usuario || usuario.perfil !== 'ALUNO') return null;
  return <MeuPlano />;
}

function MeuPlano() {
  const { painel } = usePainelDoCurso();
  const { turmas, curso } = painel;
  const slot = getSlot(curso);
  const cliente = useQueryClient();
  const { avisar } = useToasts();
  const chave = useMemo(() => ['plano', curso.codigo] as const, [curso.codigo]);
  const consulta = useQuery({ queryKey: chave, queryFn: () => apiPlano.obter(curso.codigo) });
  const saved = consulta.data?.turmaIds ?? SEM_IDS;

  // seleção em edição; null = igual ao plano salvo no servidor (estado derivado, sem efeito)
  const [edicao, setEdicao] = useState<number[] | null>(null);
  const sel = edicao ?? saved;
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<{ conflicts: Choque[]; lead: string } | null>(null);
  const [flashIds, setFlashIds] = useState<Set<number>>(() => new Set());
  const mainRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pendentes = timers.current;
    return () => pendentes.forEach((t) => window.clearTimeout(t));
  }, []);

  const porId = useMemo(() => new Map(turmas.map((t) => [t.id, t])), [turmas]);
  const conflictList = useMemo(() => findConflicts(sel, porId, slot), [sel, porId, slot]);
  const cellClash = useMemo(() => conflictCellKeys(conflictList), [conflictList]);
  const hours = useMemo(() => getHours(turmas, curso.codigo), [turmas, curso.codigo]);
  const dirty = JSON.stringify(sel) !== JSON.stringify(saved);
  const picks = chosen(sel, porId);
  const sp = chosen(saved, porId);

  /** Converte os choques do 409 (dia, início, fim, turmas) para o formato do modal. */
  const choquesDoServidor = useCallback(
    (e: ErroDeApi): Choque[] =>
      e.conflitos.flatMap((c) => {
        const [a, b] = c.turmaIds.map((id) => porId.get(id));
        if (!a || !b) return [];
        const hour = Number(c.inicio.slice(0, 2));
        return [{ day: c.dia, hour, end: Number(c.fim.slice(0, 2)), hours: [hour, hour], recs: [a, b] }];
      }),
    [porId],
  );

  const gravar = useMutation({
    mutationFn: (ids: number[]) => apiPlano.salvar(curso.codigo, ids),
    onSuccess: (r) => {
      cliente.setQueryData(chave, r);
      setEdicao(null);
    },
    onError: (e: unknown, ids) => {
      // `saved` fica como estava: o cache só muda no sucesso
      if (e instanceof ErroDeApi && e.status === 409) {
        const conflicts = choquesDoServidor(e);
        const locais = conflicts.length ? conflicts : findConflicts(ids, porId, slot);
        if (locais.length) {
          setModal({ conflicts: locais, lead: LEAD_SALVAR });
          return;
        }
      }
      avisar(e instanceof Error ? e.message : 'Não foi possível salvar o plano.', 'erro');
    },
  });

  function toggle(r: Turma) {
    if (sel.indexOf(r.id) >= 0) {
      setEdicao(sel.filter((i) => i !== r.id));
      return;
    }
    const next = sel.concat(r.id);
    const clashes = findConflicts(next, porId, slot).filter((c) => c.recs.some((rec) => rec.id === r.id));
    if (clashes.length) {
      setModal({ conflicts: clashes, lead: LEAD_ADICIONAR });
      return;
    }
    setEdicao(next);
  }

  function save() {
    const clashes = findConflicts(sel, porId, slot);
    if (clashes.length) {
      setModal({ conflicts: clashes, lead: LEAD_SALVAR });
      return;
    }
    gravar.mutate(sel);
  }

  const closeModal = useCallback(() => setModal(null), []);

  /** "Ajustar horários": fecha o aviso, leva até a grade e destaca as turmas envolvidas no choque. */
  function goAdjust(conflicts: Choque[]) {
    setModal(null);
    const target = mainRef.current;
    if (target) {
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        target.scrollIntoView();
      }
    }
    const ids = conflictIds(conflicts);
    timers.current.push(
      window.setTimeout(() => {
        setFlashIds(ids);
        timers.current.push(window.setTimeout(() => setFlashIds(new Set()), 2200));
      }, 350),
    );
  }

  if (consulta.isPending)
    return (
      <section className="view active" id="view-plano">
        <Carregando rotulo="Carregando seu plano…" linhas={5} />
      </section>
    );
  if (consulta.isError)
    return (
      <section className="view active" id="view-plano">
        <ErroComTentativa
          titulo="Não foi possível abrir seu plano"
          mensagem={consulta.error.message}
          aoTentar={() => void consulta.refetch()}
        />
      </section>
    );

  return (
    <section className="view active" id="view-plano">
      <div className="section-head">
        <div>
          <h2>Meu plano de aulas</h2>
          <div className="desc">
            Escolha as turmas em que você está inscrito. O painel monta a semana e avisa quando há choque de horário.
          </div>
        </div>
      </div>

      <PlanStats turmaCount={picks.length} />
      <PlanConflictBanner conflictList={conflictList} />

      <div className="pl-layout">
        <PlanCatalog turmas={turmas} sel={sel} q={q} flashIds={flashIds} onQ={setQ} onToggle={toggle} />
        <PlanGrid
          ref={mainRef}
          picks={picks}
          sel={sel}
          hours={hours}
          cellClash={cellClash}
          flashIds={flashIds}
          canAttempt={dirty || conflictList.length > 0}
          saving={gravar.isPending}
          onSave={save}
        />
      </div>

      <MinhaSemana sp={sp} saved={saved} slot={slot} />

      {modal && (
        <PlanConflictModal
          conflicts={modal.conflicts}
          lead={modal.lead}
          onClose={closeModal}
          onAdjust={() => goAdjust(modal.conflicts)}
        />
      )}
    </section>
  );
}
