import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { cursos } from '../../cursos/api/cursosApi';
import type { Ementa, Turma } from '../../../shared/api/tipos';
import { usePainelDoCurso } from '../../cursos/hooks/PainelDoCurso';
import { DIA_CURTO, hhmm } from '../../../shared/lib/horarios';
import { rotuloDaTurma } from '../../../shared/lib/rotulos';
import { Carregando } from '../../../shared/ui/Estados';
import { ChipSigla } from './ChipSigla';

function SecaoDeEmenta({ turma }: { turma: Turma }) {
  const consulta = useQuery<Ementa>({
    queryKey: ['ementa', turma.id],
    queryFn: () => cursos.ementaDaTurma(turma.id),
    retry: false,
    staleTime: 10 * 60_000,
  });

  return (
    <>
      <h5>EMENTA</h5>
      {consulta.isPending && <Carregando rotulo="Carregando ementa…" linhas={3} />}
      {consulta.isSuccess && (
        <>
          <div className="ementa-box">
            <div className="ementa-meta">
              {consulta.data.codigo} · {consulta.data.nome}
            </div>
            <p className="ementa-texto">{consulta.data.texto}</p>
          </div>
          <div className="ementa-fonte">Fonte: {consulta.data.fonte || 'Portal do Ementário — UNIRIO'}</div>
        </>
      )}
      {consulta.isError &&
        (turma.ementaUrl ? (
          <a className="ementa-fonte" href={turma.ementaUrl} target="_blank" rel="noopener noreferrer">
            Ver ementa no Portal do Ementário — UNIRIO
          </a>
        ) : (
          <div className="rd-empty">Ementa não disponível no ementário para esta disciplina.</div>
        ))}
    </>
  );
}

function Linha({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="db-row">
      <span className="k">{k}</span>
      <span className="v">{v || '—'}</span>
    </div>
  );
}

/** Painel lateral com os detalhes da turma. A ementa só aparece quando aberta da grade ou do índice. */
export function Gaveta() {
  const { gaveta, fecharGaveta, grade } = usePainelDoCurso();

  useEffect(() => {
    if (!gaveta) return;
    const aoTeclar = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') fecharGaveta();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [gaveta, fecharGaveta]);

  const botaoFechar = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (gaveta) botaoFechar.current?.focus();
  }, [gaveta]);

  const turma = gaveta?.turma ?? null;
  const rotulo = turma ? rotuloDaTurma(turma, grade) : null;
  const mostrarEmenta = gaveta?.origem === 'grade' || gaveta?.origem === 'disciplinas';

  return (
    <>
      <div className={`drawer-backdrop${gaveta ? ' open' : ''}`} role="presentation" onClick={fecharGaveta} />
      <aside
        className={`drawer${gaveta ? ' open' : ''}`}
        aria-hidden={!gaveta}
        role="dialog"
        aria-label="Detalhes da turma"
      >
        <div className="drawer-head">
          <button ref={botaoFechar} className="drawer-close" aria-label="Fechar" onClick={fecharGaveta}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="dh-sigla">
            {turma && <ChipSigla turma={turma} grade={grade} />}
            {turma?.editada && <span className="overridden-badge">editado</span>}
          </div>
          <h3>{rotulo?.nome}</h3>
        </div>
        {turma && (
          <div className="drawer-body">
            <div className="drawer-corr">
              {turma.curr2023 ? (
                <div className="dc-box g2023">
                  <div className="dc-lbl">GRADE 2023 · ATUAL</div>
                  <div className="dc-sigla">{turma.curr2023.sigla}</div>
                  <div className="dc-nome">{turma.curr2023.nome}</div>
                </div>
              ) : (
                <div className="dc-box empty">Sem equivalente na grade 2023</div>
              )}
              {turma.curr2008 ? (
                <div className="dc-box g2008">
                  <div className="dc-lbl">GRADE 2008 · ANTIGA</div>
                  <div className="dc-sigla">{turma.curr2008.sigla}</div>
                  <div className="dc-nome">{turma.curr2008.nome}</div>
                </div>
              ) : (
                <div className="dc-box empty">Sem equivalente na grade 2008</div>
              )}
            </div>

            {turma.aviso && (
              <div className="exception-banner" role="note">
                <div className="exception-banner-title">⚠ Aviso sobre esta turma</div>
                <div>{turma.aviso}</div>
              </div>
            )}

            <h5>DETALHES DA TURMA</h5>
            <Linha k="Professor(a)" v={turma.professor} />
            <Linha k="Sala" v={turma.sala ?? 'sem sala fixa'} />
            <Linha k="Vagas" v={turma.vagas ? String(turma.vagas) : null} />
            <Linha k="Código 2023" v={turma.curr2023?.codigo} />
            <Linha k="Código 2008" v={turma.curr2008?.codigo} />
            <Linha k="Tipo" v={turma.secao === 'pos' ? 'Optativa / Pós-graduação (PPGI)' : 'Componente regular'} />

            <h5>HORÁRIOS SEMANAIS</h5>
            {turma.horarios.length === 0 && (
              <div className="rd-empty">Sem horário fixo (orientação / atividade contínua).</div>
            )}
            {turma.horarios.map((h, i) => (
              <div className="rd-slot" style={{ marginBottom: 7 }} key={i}>
                <span className="day">{DIA_CURTO[h.diaSemana]}</span>
                <span className="hr">
                  {hhmm(h.inicio)}–{hhmm(h.fim)}
                </span>
                <span className="subj">{turma.sala ?? 'sem sala'}</span>
              </div>
            ))}

            {mostrarEmenta && <SecaoDeEmenta turma={turma} />}
          </div>
        )}
      </aside>
    </>
  );
}
