import { TabelaEmpilhavel } from '../../../shared/ui/TabelaEmpilhavel';
import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { importacao } from '../api/importacaoApi';
import { ErroDeApi } from '../../../shared/api/cliente';
import type { AcaoDaLinha, PreviaDeImportacao, ResultadoDeAplicacao } from '../../../shared/api/tipos';
import { useCursos } from '../../cursos/hooks/useCursos';
import { usePainelDoCurso } from '../../cursos/hooks/PainelDoCurso';
import { chavePainel, usePainel } from '../../cursos/hooks/usePainel';
import { DIA_CURTO, hhmm } from '../../../shared/lib/horarios';
import {
  COLUNAS_DO_MODELO,
  gerarModeloCsv,
  linhasDasTurmasAtuais,
  linhasDeExemploDoCurso,
} from '../../../shared/lib/modeloCsv';
import { AjusteExcepcional } from './AjusteExcepcional';

const ROTULO_ACAO: Record<AcaoDaLinha, string> = {
  criar: 'nova turma',
  atualizar: 'atualiza',
  sem_alteracao: 'sem mudança',
};

function baixarCsv(linhas: string[][], nomeDoArquivo: string) {
  // BOM: o Excel reconhece o arquivo como UTF-8 e mantém acentos e "ª" corretos.
  const blob = new Blob(['﻿', gerarModeloCsv(linhas)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeDoArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function VisaoAtualizarDados() {
  const { painel } = usePainelDoCurso();
  const cliente = useQueryClient();
  const { cursos } = useCursos();
  const [centro, setCentro] = useState(painel.curso.centro.sigla);
  const [destino, setDestino] = useState(painel.curso.codigo);
  const [observacao, setObservacao] = useState('');
  const [previa, setPrevia] = useState<PreviaDeImportacao | null>(null);
  const [resultado, setResultado] = useState<ResultadoDeAplicacao | null>(null);
  const [erro, setErro] = useState<{ mensagem: string; detalhes: string[] } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const centros = useMemo(() => [...new Set(cursos.map((c) => c.centro.sigla))].sort(), [cursos]);
  const cursosDoCentro = cursos.filter((c) => c.centro.sigla === centro);
  // Exemplo da planilha montado com turmas reais do curso de destino (o painel fica em cache).
  const { consulta: painelDoDestino } = usePainel(destino);
  const exemplo = useMemo(() => linhasDeExemploDoCurso(painelDoDestino.data?.turmas ?? []), [painelDoDestino.data]);
  const turmasDoDestino = useMemo(() => painelDoDestino.data?.turmas ?? [], [painelDoDestino.data]);
  const exemploReal = turmasDoDestino.length > 0;
  const siglaDoDestino = cursos.find((c) => c.codigo === destino)?.sigla ?? destino;

  function mudarCentro(sigla: string) {
    setCentro(sigla);
    const primeiro = cursos.find((c) => c.centro.sigla === sigla);
    if (primeiro) setDestino(primeiro.codigo);
    limpar();
  }

  function limpar() {
    setPrevia(null);
    setResultado(null);
    setErro(null);
    if (entrada.current) entrada.current.value = '';
  }

  async function aoEscolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    setResultado(null);
    setPrevia(null);
    setOcupado(true);
    try {
      setPrevia(await importacao.previa(destino, arquivo));
    } catch (e) {
      setErro(erroDe(e, 'Não foi possível analisar o arquivo.'));
    } finally {
      setOcupado(false);
      // permite escolher o MESMO arquivo de novo (ex.: corrigido no Excel após um erro)
      if (entrada.current) entrada.current.value = '';
    }
  }

  async function aplicar() {
    if (!previa) return;
    setOcupado(true);
    setErro(null);
    try {
      const r = await importacao.aplicar(previa.loteId, observacao.trim() || 'Importação por planilha CSV');
      setResultado(r);
      setPrevia(null);
      // atualiza o painel do curso de destino (o atual ou outro já em cache) e o exemplo desta tela
      await cliente.invalidateQueries({ queryKey: chavePainel(destino) });
    } catch (e) {
      setErro(erroDe(e, 'Não foi possível aplicar a importação.'));
      // prévia desatualizada: o lote não serve mais; o professor reenvia o arquivo
      if (e instanceof ErroDeApi && e.codigo === 'previa_desatualizada') setPrevia(null);
    } finally {
      setOcupado(false);
    }
  }

  const nomeDoDestino = cursos.find((c) => c.codigo === destino)?.nome ?? destino;
  const alteracoes = previa ? previa.totalCriar + previa.totalAtualizar : 0;

  return (
    <section className="view active" id="view-csv">
      <div className="section-head">
        <div>
          <h2>Atualização de dados por planilha</h2>
          <div className="desc">Caminho oficial para professores e turmas. Escolha o destino, envie o CSV.</div>
        </div>
        <button type="button" className="csv-template-btn exmod-trigger" onClick={() => setAjusteAberto(true)}>
          ⚠ Ajuste excepcional
        </button>
      </div>

      <div className="csv-card">
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          <div className="filter-field">
            <label htmlFor="c-centro">Centro</label>
            <select id="c-centro" value={centro} onChange={(e) => mudarCentro(e.target.value)}>
              {centros.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="c-curso">Curso de destino</label>
            <select
              id="c-curso"
              value={destino}
              onChange={(e) => {
                setDestino(e.target.value);
                limpar();
              }}
            >
              {cursosDoCentro.map((c) => (
                <option key={c.codigo} value={c.codigo}>
                  {c.sigla} — {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="csv-guide">
          <div className="desc">
            Envie um <b>arquivo .csv</b>. Em cada linha, informe Sigla + Disciplina de <b>pelo menos uma das grades</b>{' '}
            (antiga ou atual) — o resto é opcional, e o sistema reconhece o formato pelo nome das colunas abaixo.
          </div>
          <div className="desc csv-exemplo-fonte" aria-live="polite">
            {painelDoDestino.isPending
              ? 'Carregando exemplo do curso…'
              : exemploReal
                ? `Exemplo com turmas reais de ${nomeDoDestino}.`
                : `${nomeDoDestino} ainda não tem turmas cadastradas — exemplo genérico.`}
          </div>
          <div className="csv-preview-wrap" style={{ maxHeight: 'none' }}>
            <TabelaEmpilhavel className="csv-preview-table">
              <thead>
                <tr>
                  {COLUNAS_DO_MODELO.map((c) => (
                    <th key={c.nome}>
                      {c.nome}
                      <span
                        className={`csv-status-pill ${c.obrigatoria === 'par' ? 'warn' : 'ok'}`}
                        style={{ marginLeft: 6 }}
                      >
                        {c.obrigatoria === 'par' ? 'obrig.*' : 'opcional'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exemplo.map((l, i) => (
                  <tr key={i}>
                    {l.map((v, j) => (
                      <td key={j}>{v || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </TabelaEmpilhavel>
          </div>
          <div className="desc">
            <span className="csv-status-pill warn" style={{ marginRight: 5 }}>
              obrig.*
            </span>
            pelo menos um par (antiga ou atual) ·{' '}
            <span className="csv-status-pill ok" style={{ marginRight: 5 }}>
              opcional
            </span>
            demais colunas
          </div>
          <div className="csv-botoes">
            <button
              type="button"
              className="csv-template-btn"
              onClick={() => baixarCsv(exemplo, `modelo_${destino}.csv`)}
            >
              ⬇ Modelo de {siglaDoDestino} (.csv)
            </button>
            <button
              type="button"
              className="csv-template-btn"
              disabled={!exemploReal}
              title="Planilha com todas as turmas do curso (cada linha com o Id da turma): edite e reenvie para corrigir."
              onClick={() => baixarCsv(linhasDasTurmasAtuais(turmasDoDestino), `turmas_${destino}.csv`)}
            >
              ⬇ Turmas atuais de {siglaDoDestino} (.csv)
            </button>
          </div>
        </div>

        <div className="edit-field">
          <label htmlFor="c-obs">Observação</label>
          <textarea
            id="c-obs"
            rows={2}
            placeholder="Observação deste lote (opcional) — aparece no histórico."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>

        <div className="csv-drop">
          <div>Selecione o arquivo .csv</div>
          <input
            ref={entrada}
            type="file"
            accept=".csv,text/csv"
            aria-label="Arquivo CSV"
            disabled={ocupado}
            onChange={(e) => void aoEscolherArquivo(e.target.files?.[0])}
          />
        </div>

        {erro && (
          <div className="auth-error" role="alert" style={{ marginTop: 12 }}>
            {erro.mensagem}
            {erro.detalhes.length > 0 && (
              <ul className="csv-erro-detalhes">
                {erro.detalhes.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {ocupado && (
          <div className="desc" style={{ marginTop: 12 }}>
            Processando…
          </div>
        )}

        {previa && (
          <div id="csvResultsWrap">
            {previa.avisoGeral && (
              <div className="plan-error" role="status">
                <div className="plan-error-sub">{previa.avisoGeral}</div>
              </div>
            )}
            <div className="csv-summary">
              <div>
                <div className="n">{previa.totalCriar}</div>
                <div className="lbl">turmas novas</div>
              </div>
              <div>
                <div className="n">{previa.totalAtualizar}</div>
                <div className="lbl">atualizações</div>
              </div>
              <div>
                <div className="n">{previa.totalSemAlteracao}</div>
                <div className="lbl">sem mudança</div>
              </div>
              <div className={previa.totalErro ? 'tem-erro' : undefined}>
                <div className="n">{previa.totalErro}</div>
                <div className="lbl">com erro (ignoradas)</div>
              </div>
            </div>
            <div className="csv-preview-wrap">
              <TabelaEmpilhavel className="csv-preview-table">
                <thead>
                  <tr>
                    {['Linha', 'Status', 'Ação', 'Sigla', 'Disciplina', 'Professor', 'Sala', 'Horários', 'Obs.'].map(
                      (h) => (
                        <th key={h}>{h}</th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previa.linhas.map((l) =>
                    l.situacao === 'erro' ? (
                      <tr key={l.numero}>
                        <td>{l.numero}</td>
                        <td>
                          <span className="csv-status-pill erro">erro</span>
                        </td>
                        <td>—</td>
                        <td colSpan={6}>{l.mensagem}</td>
                      </tr>
                    ) : (
                      <tr key={l.numero}>
                        <td>{l.numero}</td>
                        <td>
                          <span className={`csv-status-pill ${l.situacao === 'aviso' ? 'warn' : 'ok'}`}>
                            {l.situacao}
                          </span>
                        </td>
                        <td>{l.acao ? <span className={`csv-acao ${l.acao}`}>{ROTULO_ACAO[l.acao]}</span> : '—'}</td>
                        <td>{l.sigla ?? '—'}</td>
                        <td>{l.disciplina ?? '—'}</td>
                        <td>{l.professor || '—'}</td>
                        <td>{l.sala || '—'}</td>
                        <td>
                          {l.horarios.map((h) => `${DIA_CURTO[h.diaSemana]} ${hhmm(h.inicio)}`).join(' · ') || '—'}
                        </td>
                        <td>{l.mensagem || '—'}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </TabelaEmpilhavel>
            </div>
            <button
              type="button"
              className="csv-apply-btn"
              disabled={!alteracoes || ocupado}
              onClick={() => void aplicar()}
            >
              {alteracoes
                ? `Aplicar ${alteracoes} alteração(ões) em ${siglaDoDestino}`
                : 'Nada a aplicar: as turmas já estão assim'}
            </button>
          </div>
        )}

        {resultado && (
          <div className="edit-saved-note" role="status">
            {resultado.criadas} criada(s), {resultado.atualizadas} atualizada(s), {resultado.semAlteracao} sem alteração
            {resultado.salasCriadas > 0 ? `, ${resultado.salasCriadas} sala(s) nova(s) no catálogo` : ''}.
            {destino !== painel.curso.codigo ? ` Abra o painel de ${nomeDoDestino} para ver o resultado.` : ''}
          </div>
        )}
      </div>

      {ajusteAberto && <AjusteExcepcional aoFechar={() => setAjusteAberto(false)} />}
    </section>
  );
}

function erroDe(e: unknown, padrao: string): { mensagem: string; detalhes: string[] } {
  if (e instanceof ErroDeApi) return { mensagem: e.message, detalhes: e.detalhes };
  return { mensagem: e instanceof Error ? e.message : padrao, detalhes: [] };
}
