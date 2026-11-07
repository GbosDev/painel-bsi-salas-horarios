// Leitura e análise (sem acesso a banco) dos arquivos de dados do painel estático original.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

export const ARQUIVOS = ['horario-data.js', 'ementas.js', 'ibio-data.js', 'eng-data.js', 'mat-data.js', 'courses-data.js'];

/** Executa os .js legados em um sandbox isolado (sem require, sem rede) e devolve o objeto window resultante. */
export function carregarJanelaLegada(diretorio) {
  const janela = {};
  const contexto = vm.createContext({ window: janela, console: { log() {}, warn() {}, error() {} } });
  for (const arq of ARQUIVOS) {
    const caminho = path.join(diretorio, arq);
    if (!fs.existsSync(caminho)) throw new Error(`Arquivo legado ausente: ${caminho}`);
    vm.runInContext(fs.readFileSync(caminho, 'utf8'), contexto, { filename: arq, timeout: 5000 });
  }
  return janela;
}

export const normalizarTexto = (s) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

/** Chave de identidade de docente: sem acentos/caixa e sem tratamento (Prof., Profa., Dr., Dra.). */
export const chaveDocente = (s) =>
  normalizarTexto(s).replace(/^(prof(essor)?a?|dra?)(?:[ªº]|\b)\.?\s*/i, '').replace(/^(prof(essor)?a?|dra?)(?:[ªº]|\b)\.?\s*/i, '').replace(/\s+/g, ' ').trim();

export const limparTexto = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

export function chaveNaturalDisciplina(cursoCodigo, matriz, d) {
  const base = [cursoCodigo, matriz, limparTexto(d.sigla), limparTexto(d.codigo), limparTexto(d.nome), limparTexto(d.periodo)].join('|');
  return crypto.createHash('sha256').update(base, 'utf8').digest('hex');
}

const pad = (n) => String(n).padStart(2, '0');
export const horaParaTime = (h) => `${pad(h)}:00:00`;

/**
 * Duração de cada sessão. BSI registra blocos de 2h (a primeira hora do bloco);
 * ENG/IBIO/MAT registram uma entrada por hora de aula (ex.: 16 e 17).
 */
export const duracaoSessaoHoras = (cursoCodigo) => (cursoCodigo === 'bsi' ? 2 : 1);

export const SALAS_CATALOGO_BSI = ['Lab. 1', 'Lab. 2', 'Lab. 3', 'Lab. SAN', 'Sala 105', 'Sala 212', 'Sala 215', 'Anexo 1', 'Anexo 2'];

/** Conjuntos de dados por curso, no formato legado. */
export function conjuntosPorCurso(janela) {
  const ib = janela.IBIO_DATA || {};
  const todos = janela.BUSSOLA_DATASETS || {};
  return {
    bsi: janela.BSI_DATA || [],
    eng: janela.ENG_DATA || [],
    mat: todos.mat || [],
    'ibio-bcb': ib['ibio-bcb'] || [],
    'ibio-lcb': ib['ibio-lcb'] || [],
    'ibio-bca': ib['ibio-bca'] || [],
    'ibio-lcn': ib['ibio-lcn'] || [],
  };
}

/** Converte um registro legado em turma normalizada (intervalos reais). */
export function normalizarRegistro(cursoCodigo, r) {
  const dur = duracaoSessaoHoras(cursoCodigo);
  const horarios = (r.sessions || []).map((s) => ({
    dia: s.day_num, inicio: s.hour, fim: s.hour + dur,
  }));
  const disc = (c, matriz) => c ? {
    matriz, sigla: limparTexto(c.sigla), codigo: limparTexto(c.codigo) || null,
    nome: limparTexto(c.nome), periodo: limparTexto(c.periodo), pos: !!c.ppgi,
  } : null;
  return {
    idLegado: r.id,
    d2023: disc(r.curr2023, 2023),
    d2008: disc(r.curr2008, 2008),
    professor: limparTexto(r.professor) || null,
    sala: limparTexto(r.sala) || null,
    vagas: Number.isFinite(+r.vagas) ? Math.max(0, +r.vagas) : 0,
    secao: r.section === 'pos' ? 'pos' : 'regular',
    ementaUrl: r.ementa_url || null,
    aviso: limparTexto(r.aviso) || null,
    horarios,
  };
}

const intervalosSobrepoem = (a, b) => a.dia === b.dia && a.inicio < b.fim && b.inicio < a.fim;

/** Conflitos de sala entre turmas diferentes do mesmo centro (docentes diferentes na mesma sala e horário). */
export function conflitosDeSala(turmasPorCentro) {
  const out = [];
  for (const [centro, turmas] of Object.entries(turmasPorCentro)) {
    const porSala = new Map();
    for (const t of turmas) if (t.sala) { if (!porSala.has(t.sala)) porSala.set(t.sala, []); porSala.get(t.sala).push(t); }
    for (const [sala, lista] of porSala) {
      for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
        // Mesma sala, mesmo(a) docente: aula compartilhada entre cursos (não é conflito).
        if (lista[i].professor && chaveDocente(lista[i].professor) === chaveDocente(lista[j].professor)) continue;
        for (const a of lista[i].horarios) for (const b of lista[j].horarios) {
          if (intervalosSobrepoem(a, b)) out.push({ centro, sala, dia: a.dia, inicio: Math.max(a.inicio, b.inicio),
            turmaA: `${lista[i].curso}#${lista[i].idLegado}`, turmaB: `${lista[j].curso}#${lista[j].idLegado}` });
        }
      }
    }
  }
  return out;
}

/** Analisa a qualidade dos dados de origem; devolve contagens e anomalias para o relatório. */
export function analisarOrigem(conjuntos, centroDoCurso) {
  const anomalias = [];
  const resumo = {};
  const turmasPorCentro = {};
  for (const [curso, registros] of Object.entries(conjuntos)) {
    const norm = registros.map((r) => ({ ...normalizarRegistro(curso, r), curso }));
    const ids = norm.map((t) => t.idLegado);
    const idsDuplicados = ids.length - new Set(ids).size;
    if (idsDuplicados) anomalias.push({ curso, tipo: 'id_legado_duplicado', quantidade: idsDuplicados });
    const semHorario = norm.filter((t) => !t.horarios.length).length;
    const semSala = norm.filter((t) => !t.sala).length;
    const semProfessor = norm.filter((t) => !t.professor).length;
    const semDisciplina = norm.filter((t) => !t.d2023 && !t.d2008).length;
    if (semDisciplina) anomalias.push({ curso, tipo: 'turma_sem_disciplina', quantidade: semDisciplina });
    const vistos = new Map(); let siglasDivergentes = 0;
    for (const t of norm) for (const d of [t.d2023, t.d2008]) if (d) {
      const k = `${d.matriz}|${d.sigla}`; const v = `${d.codigo}|${d.nome}|${d.periodo}`;
      if (vistos.has(k) && vistos.get(k) !== v) siglasDivergentes++; else if (!vistos.has(k)) vistos.set(k, v);
    }
    if (siglasDivergentes) anomalias.push({ curso, tipo: 'sigla_repetida_com_dados_diferentes', quantidade: siglasDivergentes,
      tratamento: 'mantidas como disciplinas distintas (chave natural inclui código, nome e período)' });
    resumo[curso] = { turmas: norm.length, horarios: norm.reduce((s, t) => s + t.horarios.length, 0), semHorario, semSala, semProfessor };
    (turmasPorCentro[centroDoCurso[curso]] ||= []).push(...norm);
  }
  const conflitos = conflitosDeSala(turmasPorCentro);
  return { resumo, anomalias, conflitos, normalizadas: turmasPorCentro };
}
