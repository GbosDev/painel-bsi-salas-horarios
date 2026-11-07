import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ErroDeApi } from '../../../shared/api/cliente';
import { plano as apiPlano } from '../api/planoApi';
import { usePainelDoCurso } from '../../cursos/hooks/PainelDoCurso';
import { textoDaTurma } from '../../../shared/lib/busca';
import { celulaTemConflito, encontrarConflitos, textoDoTrecho } from '../../../shared/lib/conflitos';
import {
  DIAS,
  DIA_CURTO,
  DIA_LONGO,
  formatarHora,
  hhmm,
  opcoesDeInicio,
  paraMinutos,
} from '../../../shared/lib/horarios';
import { nomePrincipal } from '../../../shared/lib/rotulos';
import type { Turma } from '../../../shared/api/tipos';
import { Carregando, ErroComTentativa } from '../../../shared/ui/Estados';
import { useToasts } from '../../../shared/ui/Toasts';

const CORES = ['#3D8577', '#7C5A72', '#B97A22', '#B65C4A', '#445374', '#2A5F55', '#5C4155'];

function mesmaLista(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function VisaoMeuPlano() {
  const { painel } = usePainelDoCurso();
  const { turmas, curso } = painel;
  const duracao = curso.duracaoAulaHoras;
  const cliente = useQueryClient();
  const { avisar } = useToasts();
  const chave = ['plano', curso.codigo] as const;
  const consulta = useQuery({ queryKey: chave, queryFn: () => apiPlano.obter(curso.codigo) });
  const salvo = useMemo(() => consulta.data?.turmaIds ?? [], [consulta.data]);
  // seleção em edição; null = ainda igual ao plano salvo no servidor (estado derivado, sem efeito)
  const [edicao, setEdicao] = useState<number[] | null>(null);
  const sel = edicao ?? salvo;
  const setSel = (f: number[] | ((a: number[]) => number[])) =>
    setEdicao((atual) => (typeof f === 'function' ? f(atual ?? salvo) : f));
  const [q, setQ] = useState('');
  const [erro, setErro] = useState<{ mensagem: string; detalhes: string[] } | null>(null);

  const gravar = useMutation({
    mutationFn: (ids: number[]) => apiPlano.salvar(curso.codigo, ids),
    onSuccess: (r) => {
      cliente.setQueryData(chave, r);
      setEdicao(null);
      avisar('Plano salvo.');
    },
    onError: (e: unknown) => {
      if (e instanceof ErroDeApi) setErro({ mensagem: e.message, detalhes: e.detalhes });
      else setErro({ mensagem: 'Não foi possível salvar o plano.', detalhes: [] });
    },
  });
  const salvando = gravar.isPending;

  const porId = useMemo(() => new Map(turmas.map((t) => [t.id, t])), [turmas]);
  const escolhidas = sel.map((id) => porId.get(id)).filter((t): t is Turma => !!t);
  const conflitos = useMemo(() => encontrarConflitos(escolhidas), [escolhidas]);
  const horas = useMemo(() => opcoesDeInicio(turmas, duracao), [turmas, duracao]);
  const sujo = !mesmaLista(sel, salvo);
  const termo = q.toLowerCase();

  function alternar(id: number) {
    setErro(null);
    setSel((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  function salvar() {
    if (conflitos.length) return; // a validação definitiva é do servidor; aqui evita a viagem de rede
    setErro(null);
    gravar.mutate(sel);
  }

  const salvas = salvo.map((id) => porId.get(id)).filter((t): t is Turma => !!t);
  const agenda = DIAS.map((d) => ({
    dia: d,
    itens: salvas
      .flatMap((t) => t.horarios.filter((h) => h.diaSemana === d).map((h) => ({ t, h })))
      .sort((a, b) => paraMinutos(a.h.inicio) - paraMinutos(b.h.inicio)),
  }));

  if (consulta.isPending)
    return (
      <section className="view active" id="view-plano">
        <Carregando rotulo="Carregando seu plano…" linhas={5} />
      </section>
    );
  if (consulta.isError) {
    return (
      <section className="view active" id="view-plano">
        <ErroComTentativa
          titulo="Não foi possível abrir seu plano"
          mensagem={consulta.error.message}
          aoTentar={() => void consulta.refetch()}
        />
      </section>
    );
  }

  return (
    <section className="view active" id="view-plano">
      <div className="section-head">
        <div>
          <h2>Meu plano de aulas</h2>
          <div className="desc">
            Escolha as turmas em que você está inscrito. O painel monta a semana, mostra as salas e avisa se houver
            conflito de horário.
          </div>
        </div>
      </div>

      <div className="csv-summary">
        <div>
          <div className="n">{escolhidas.length}</div>
          <div className="lbl">turma(s) selecionada(s)</div>
        </div>
      </div>

      {conflitos.length > 0 && (
        <div className="plan-error" role="alert">
          <div className="plan-error-title">
            Não foi possível salvar seu plano porque existem conflitos de horários entre as turmas selecionadas.
          </div>
          <div className="plan-error-sub">
            Revise os dias e horários das disciplinas indicadas e ajuste as informações antes de tentar novamente.
          </div>
          <div className="plan-error-list">
            {conflitos.map((c) => (
              <div className="plan-error-item" key={`${c.dia}-${c.inicio}-${c.fim}`}>
                <b>
                  {DIA_LONGO[c.dia]} · {textoDoTrecho(c)}
                </b>
                :{' '}
                {c.turmas
                  .map((t) => {
                    const n = nomePrincipal(t);
                    return `${n.sigla} — ${n.nome}`;
                  })
                  .join('  ×  ')}
              </div>
            ))}
          </div>
        </div>
      )}
      {erro && (
        <div className="plan-error" role="alert">
          <div className="plan-error-title">{erro.mensagem}</div>
          {erro.detalhes.length > 0 && (
            <div className="plan-error-list">
              {erro.detalhes.map((d) => (
                <div className="plan-error-item" key={d}>
                  {d}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pl-layout">
        <div className="pl-cat">
          <input
            type="text"
            aria-label="Filtrar turmas"
            placeholder="Filtrar por sigla, disciplina ou professor"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="pl-list">
            {turmas
              .filter((t) => !termo || textoDaTurma(t).includes(termo))
              .map((t) => {
                const n = nomePrincipal(t);
                const ligada = sel.includes(t.id);
                return (
                  <button
                    type="button"
                    key={t.id}
                    className={`pl-item${ligada ? ' on' : ''}`}
                    aria-pressed={ligada}
                    onClick={() => alternar(t.id)}
                  >
                    <b>{n.sigla}</b>
                    <span>{n.nome}</span>
                    <small>
                      {t.professor ?? ''} · {t.sala ?? 'sem sala'} ·{' '}
                      {t.horarios.map((h) => `${DIA_CURTO[h.diaSemana]} ${hhmm(h.inicio)}`).join(', ') ||
                        'sem horário fixo'}
                    </small>
                  </button>
                );
              })}
          </div>
        </div>
        <div className="pl-main">
          <div className="pl-bar">
            <button
              type="button"
              className="edit-save-btn"
              disabled={!sujo || conflitos.length > 0 || salvando}
              onClick={salvar}
            >
              {conflitos.length
                ? 'Resolva os choques para salvar'
                : salvando
                  ? 'Salvando…'
                  : sujo
                    ? 'Salvar plano'
                    : 'Plano salvo'}
            </button>
          </div>
          <div className="pl-gridwrap">
            <div className="pl-grid">
              <div />
              {DIAS.map((d) => (
                <div className="pl-dh" key={d}>
                  {DIA_CURTO[d]}
                </div>
              ))}
              {horas.flatMap((h) => [
                <div className="pl-hh" key={`h${h}`}>
                  {formatarHora(h)}
                </div>,
                ...DIAS.map((d) => (
                  <div
                    key={`${h}-${d}`}
                    className={`pl-cell${celulaTemConflito(conflitos, d, h * 60, (h + duracao) * 60) ? ' clash' : ''}`}
                  >
                    {escolhidas
                      .filter((t) =>
                        t.horarios.some((x) => x.diaSemana === d && Math.floor(paraMinutos(x.inicio) / 60) === h),
                      )
                      .map((t) => (
                        <div
                          key={t.id}
                          className="pl-block"
                          style={{ background: CORES[sel.indexOf(t.id) % CORES.length] }}
                        >
                          <b>{nomePrincipal(t).sigla}</b>
                          <span>{t.sala ?? 'sem sala'}</span>
                        </div>
                      ))}
                  </div>
                )),
              ])}
            </div>
          </div>
        </div>
      </div>

      <div className="pl-agenda">
        <h3>Minha semana</h3>
        {salvas.length === 0 ? (
          <div className="rd-empty">
            Salve um plano para ver sua agenda organizada por dia, com disciplina, professor(a) e sala de cada aula.
          </div>
        ) : (
          <>
            <div className="pl-daypills">
              {agenda.map((a) => (
                <a key={a.dia} href={`#pl-day-${a.dia}`} className={`pl-pill${a.itens.length ? ' has' : ''}`}>
                  {DIA_CURTO[a.dia]}
                  <span className="ct">{a.itens.length}</span>
                </a>
              ))}
            </div>
            {agenda.map((a) => (
              <div className="pl-day" id={`pl-day-${a.dia}`} key={a.dia}>
                <h4>{DIA_LONGO[a.dia]}</h4>
                {a.itens.length === 0 && <div className="pl-day-empty">Nenhuma aula — dia livre.</div>}
                {a.itens.map(({ t, h }, i) => {
                  const n = nomePrincipal(t);
                  const cor = CORES[Math.max(0, sel.indexOf(t.id)) % CORES.length];
                  return (
                    <div className="pl-row" style={{ borderLeftColor: cor }} key={`${t.id}-${i}`}>
                      <b>{hhmm(h.inicio)}</b>
                      <div>
                        <strong>
                          {n.sigla} — {n.nome}
                        </strong>
                        <small>
                          {t.professor ?? 'professor não informado'} · {t.sala ?? 'sem sala'}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
