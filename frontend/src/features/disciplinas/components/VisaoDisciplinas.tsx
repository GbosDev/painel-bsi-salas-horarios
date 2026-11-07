import { TabelaEmpilhavel } from '../../../shared/ui/TabelaEmpilhavel';
import { useMemo, useState } from 'react';
import { usePainelDoCurso } from '../../cursos/hooks/PainelDoCurso';
import { horariosEmTexto } from '../../../shared/lib/horarios';
import { PERIODOS, achatarDisciplinas, profCurto, type LinhaDeDisciplina } from '../../../shared/lib/rotulos';
import { ChipSigla } from '../../turmas/components/ChipSigla';

type Chave = 'sigla' | 'nome' | 'grade' | 'periodo' | 'professor' | 'sala';

const valorDeOrdenacao: Record<Chave, (x: LinhaDeDisciplina) => string> = {
  sigla: (x) => x.sigla,
  nome: (x) => x.nome,
  grade: (x) => x.grade,
  periodo: (x) => x.periodo,
  professor: (x) => x.turma.professor ?? '',
  sala: (x) => x.turma.sala ?? '',
};

export function VisaoDisciplinas() {
  const { painel, abrirGaveta } = usePainelDoCurso();
  const [grade, setGrade] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [secao, setSecao] = useState('');
  const [q, setQ] = useState('');
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: 1 | -1 }>({ chave: 'periodo', dir: 1 });

  const linhas = useMemo(() => {
    const termo = q.toLowerCase();
    const filtradas = achatarDisciplinas(painel.turmas).filter((x) => {
      if (grade && x.grade !== grade) return false;
      if (periodo && x.periodo !== periodo) return false;
      if (secao && x.turma.secao !== secao) return false;
      if (termo) {
        const palheiro = [x.sigla, x.nome, x.turma.professor, x.turma.sala].filter(Boolean).join(' ').toLowerCase();
        if (!palheiro.includes(termo)) return false;
      }
      return true;
    });
    const f = valorDeOrdenacao[ordem.chave];
    return filtradas.sort((a, b) => f(a).localeCompare(f(b), 'pt-BR', { numeric: true }) * ordem.dir);
  }, [painel.turmas, grade, periodo, secao, q, ordem]);

  const ordenar = (chave: Chave) =>
    setOrdem((o) => (o.chave === chave ? { chave, dir: o.dir === 1 ? -1 : 1 } : { chave, dir: 1 }));
  const cab = (chave: Chave, rotulo: string) => (
    <th data-sort={chave} className={ordem.chave === chave ? 'sorted' : ''} onClick={() => ordenar(chave)}>
      {rotulo} <span className="sort-arrow">↕</span>
    </th>
  );

  return (
    <section className="view active" id="view-disciplinas">
      <div className="section-head">
        <div>
          <h2>Índice de disciplinas</h2>
          <div className="desc">
            {painel.curso.alternaMatrizes
              ? 'Correspondência entre a grade antiga (2008) e a atual (2023), com professor, sala e horário.'
              : 'Disciplinas do curso, com professor, sala e horário.'}
          </div>
        </div>
      </div>
      <div className="filter-bar">
        <div className="filter-field">
          <label htmlFor="d-grade">Grade</label>
          <select id="d-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">Ambas as grades</option>
            <option value="2023">2023 — atual</option>
            <option value="2008">2008 — antiga</option>
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="d-periodo">Período</label>
          <select id="d-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="">Todos os períodos</option>
            {PERIODOS.map((p) => (
              <option key={p} value={p}>
                {p === 'A' ? 'A — atividades' : p === 'O' ? 'O — optativas' : `Período ${p}`}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="d-secao">Seção</label>
          <select id="d-secao" value={secao} onChange={(e) => setSecao(e.target.value)}>
            <option value="">Todas</option>
            <option value="regular">Regular</option>
            <option value="pos">Optativa / Pós (PPGI)</option>
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="d-q">Buscar</label>
          <input
            id="d-q"
            type="text"
            placeholder="sigla, nome, professor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          className="filter-reset"
          onClick={() => {
            setGrade('');
            setPeriodo('');
            setSecao('');
            setQ('');
          }}
        >
          Limpar filtros
        </button>
        <div className="filter-count">
          {linhas.length} disciplina{linhas.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="index-table-wrap">
        <TabelaEmpilhavel className="index-table">
          <thead>
            <tr>
              {cab('sigla', 'Sigla')}
              {cab('nome', 'Disciplina')}
              {cab('grade', 'Grade')}
              {cab('periodo', 'Período')}
              {cab('professor', 'Professor')}
              {cab('sala', 'Sala')}
              <th>Horários</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">Nenhuma disciplina encontrada com esses filtros.</div>
                </td>
              </tr>
            )}
            {linhas.map((x) => (
              <tr key={`${x.turma.id}-${x.grade}`} onClick={() => abrirGaveta(x.turma, 'disciplinas')}>
                <td>
                  <ChipSigla turma={x.turma} grade={x.grade} />
                </td>
                <td className="nome-cell">
                  <span className="nm">{x.nome}</span>
                </td>
                <td>{x.grade === '2023' ? 'Atual' : 'Antiga'}</td>
                <td>
                  <span className="sec-tag">
                    {x.periodo ? x.periodo + (x.turma.secao === 'pos' ? ' · pós' : '') : '—'}
                  </span>
                </td>
                <td>{profCurto(x.turma.professor)}</td>
                <td>{x.turma.sala || '—'}</td>
                <td>{horariosEmTexto(x.turma) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </TabelaEmpilhavel>
      </div>
    </section>
  );
}
