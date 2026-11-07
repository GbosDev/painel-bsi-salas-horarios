import { TabelaEmpilhavel } from '../../../shared/ui/TabelaEmpilhavel';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { historico } from '../api/historicoApi';
import type { RegistroDeAuditoria } from '../../../shared/api/tipos';
import { Carregando, ErroComTentativa } from '../../../shared/ui/Estados';
import { useCursos } from '../../cursos/hooks/useCursos';
import { CLASSE_DO_TIPO, ROTULO_DO_TIPO, formatarDataHora, resumoDaMudanca } from '../../../shared/lib/auditoria';

export function VisaoHistorico() {
  const { cursos } = useCursos();
  const [curso, setCurso] = useState('todos');
  const [tipo, setTipo] = useState('todos');
  const [periodo, setPeriodo] = useState('30');
  const [q, setQ] = useState('');
  const [busca, setBusca] = useState('');
  // debounce da busca textual: evita uma requisição por tecla
  useEffect(() => {
    const espera = window.setTimeout(() => setBusca(q.trim()), q ? 300 : 0);
    return () => window.clearTimeout(espera);
  }, [q]);
  const consulta = useQuery({
    queryKey: ['historico', { curso, tipo, periodo, busca }],
    queryFn: () => historico.listar({ curso, tipo, periodo, q: busca }),
    placeholderData: keepPreviousData,
  });
  const registros: RegistroDeAuditoria[] = consulta.data ?? [];

  const contagem: Record<string, number> = {};
  for (const r of registros) contagem[r.tipo] = (contagem[r.tipo] ?? 0) + 1;

  return (
    <section className="view active" id="view-historico">
      <div className="section-head">
        <div>
          <h2>Histórico de alterações</h2>
          <div className="desc">Quem alterou, o quê e por quê — importações e ajustes excepcionais.</div>
        </div>
      </div>
      <div className="filter-bar">
        <div className="filter-field">
          <label htmlFor="h-curso">Curso</label>
          <select id="h-curso" value={curso} onChange={(e) => setCurso(e.target.value)}>
            <option value="todos">Todos os cursos</option>
            {cursos.map((c) => (
              <option key={c.codigo} value={c.codigo}>
                {c.sigla}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="h-tipo">Tipo de alteração</label>
          <select id="h-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="todos">Todos os tipos</option>
            {Object.entries(ROTULO_DO_TIPO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="h-periodo">Período</label>
          <select id="h-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="1">Hoje</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="tudo">Tudo</option>
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="h-q">Buscar</label>
          <input
            id="h-q"
            type="text"
            placeholder="turma, autor, motivo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="csv-summary">
        <div>
          <div className="n">{registros.length}</div>
          <div className="lbl">alterações no período</div>
        </div>
        {['csv_atualizada', 'csv_criada', 'exceptional_edit', 'exceptional_delete']
          .filter((t) => contagem[t])
          .map((t) => (
            <div key={t}>
              <div className="n">{contagem[t]}</div>
              <div className="lbl">{ROTULO_DO_TIPO[t]}</div>
            </div>
          ))}
      </div>

      {consulta.isError && (
        <ErroComTentativa mensagem={consulta.error.message} aoTentar={() => void consulta.refetch()} />
      )}
      {consulta.isPending && <Carregando rotulo="Carregando histórico…" />}
      <div className="csv-preview-wrap" style={{ maxHeight: 'none' }}>
        <TabelaEmpilhavel className="csv-preview-table hist-table">
          <thead>
            <tr>
              {['Data/Hora', 'Tipo', 'Curso', 'Turma', 'Autor', 'O que mudou', 'Motivo'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {consulta.isSuccess && registros.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">Nenhuma alteração encontrada com esses filtros.</div>
                </td>
              </tr>
            )}
            {registros.map((r) => (
              <tr key={r.id}>
                <td>{formatarDataHora(r.ocorridaEm)}</td>
                <td>
                  <span className={`csv-status-pill ${CLASSE_DO_TIPO[r.tipo] ?? 'ok'}`}>
                    {ROTULO_DO_TIPO[r.tipo] ?? r.tipo}
                  </span>
                </td>
                <td>{r.cursoNome ?? r.cursoCodigo ?? '—'}</td>
                <td>{(r.turmaSigla ?? '—') + ' — ' + (r.turmaNome ?? '')}</td>
                <td>{r.autor || '—'}</td>
                <td>{resumoDaMudanca(r.antes, r.depois)}</td>
                <td>{r.motivo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </TabelaEmpilhavel>
      </div>
    </section>
  );
}
