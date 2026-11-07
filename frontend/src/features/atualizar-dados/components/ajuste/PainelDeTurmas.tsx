import { useMemo, useState, type ReactNode } from 'react';
import type { Turma } from '../../../../shared/api/tipos';
import { DIA_CURTO, hhmm } from '../../../../shared/lib/horarios';
import { nomePrincipal } from '../../../../shared/lib/rotulos';
import { Vazio } from '../../../../shared/ui/Estados';
import { usePainelDoCurso } from '../../../cursos/hooks/PainelDoCurso';
import { ConfirmarExclusao } from './ConfirmarExclusao';
import { FormularioDeEdicao } from './FormularioDeEdicao';
import { FormularioNovaTurma } from './FormularioNovaTurma';

type Modo =
  { tipo: 'nenhum' } | { tipo: 'nova' } | { tipo: 'editar'; turma: Turma } | { tipo: 'excluir'; turma: Turma };

const rotuloDeHorarios = (t: Turma) =>
  t.horarios.map((h) => `${DIA_CURTO[h.diaSemana]} ${hhmm(h.inicio)}`).join(' · ') || 'sem horário fixo';

/** Aba "Turmas": lista com busca à esquerda, editor à direita (empilhados no celular). */
export function PainelDeTurmas({ aoConcluir }: { aoConcluir: (mensagem: string, avisos: string[]) => void }) {
  const { painel } = usePainelDoCurso();
  const [modo, setModo] = useState<Modo>({ tipo: 'nenhum' });
  const [q, setQ] = useState('');

  const lista = useMemo(() => {
    const t = q.toLowerCase().trim();
    return painel.turmas.filter((x) => {
      const n = nomePrincipal(x);
      return !t || `${n.sigla} ${n.nome} ${x.professor ?? ''} ${x.sala ?? ''}`.toLowerCase().includes(t);
    });
  }, [painel.turmas, q]);

  const selecionada = modo.tipo === 'editar' || modo.tipo === 'excluir' ? modo.turma.id : null;
  const voltar = () => setModo({ tipo: 'nenhum' });
  const concluir = (mensagem: string, avisos: string[]) => {
    voltar();
    aoConcluir(mensagem, avisos);
  };

  let editor: ReactNode;
  if (modo.tipo === 'nova')
    editor = <FormularioNovaTurma aoCancelar={voltar} aoConcluir={(a) => concluir('Turma criada.', a)} />;
  else if (modo.tipo === 'editar')
    editor = (
      <FormularioDeEdicao
        key={modo.turma.id}
        turma={modo.turma}
        aoCancelar={voltar}
        aoConcluir={(a) => concluir('Ajuste salvo.', a)}
      />
    );
  else if (modo.tipo === 'excluir')
    editor = (
      <ConfirmarExclusao
        key={modo.turma.id}
        turma={modo.turma}
        aoCancelar={voltar}
        aoConcluir={() => concluir('Turma excluída.', [])}
      />
    );
  else {
    editor = (
      <div className="xt-placeholder">
        <div className="xt-ph-ico" aria-hidden="true">
          ✎
        </div>
        <b>Selecione uma turma</b>
        <span>Clique em “Editar” ou “Excluir” na lista, ou crie uma turma excepcional.</span>
      </div>
    );
  }

  return (
    <div className="xt">
      <div className="xt-left">
        <div className="xt-tools">
          <input
            type="search"
            aria-label="Buscar turma"
            placeholder="Buscar por sigla, disciplina, professor ou sala…"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="edit-save-btn xt-new" onClick={() => setModo({ tipo: 'nova' })}>
            + Nova turma
          </button>
        </div>
        <span className="xt-count" aria-live="polite">
          {lista.length} {lista.length === 1 ? 'turma' : 'turmas'}
        </span>
        <div className="xt-list">
          {lista.length === 0 && (
            <Vazio titulo="Nenhuma turma encontrada" orientacao="Tente outra busca ou crie uma turma excepcional." />
          )}
          {lista.map((t) => {
            const n = nomePrincipal(t);
            return (
              <div key={t.id} className={`xt-row${selecionada === t.id ? ' selected' : ''}`}>
                <div className="xt-main">
                  <span className="xt-sigla">{n.sigla || '—'}</span>
                  <span className="xt-nome">{n.nome}</span>
                </div>
                <div className="xt-meta">
                  <span>
                    <i>Prof.</i> {t.professor || '—'}
                  </span>
                  <span>
                    <i>Sala</i> {t.sala || '—'}
                  </span>
                  <span>
                    <i>Horários</i> {rotuloDeHorarios(t)}
                  </span>
                </div>
                <div className="xt-act">
                  <button type="button" className="ad-btn" onClick={() => setModo({ tipo: 'editar', turma: t })}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="ad-btn danger"
                    onClick={() => setModo({ tipo: 'excluir', turma: t })}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={`xt-editor${modo.tipo === 'nenhum' ? '' : ' has-form'}`}>{editor}</div>
    </div>
  );
}
