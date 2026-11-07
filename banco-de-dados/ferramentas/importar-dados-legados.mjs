#!/usr/bin/env node
// Importação repetível (idempotente) dos dados do painel estático original para o MySQL.
//
// Regras:
//  * não apaga nada; turmas já importadas (curso + id legado) são mantidas como estão;
//  * tudo roda em uma transação (--simular faz ROLLBACK ao final);
//  * senhas/credenciais vêm só de variáveis de ambiente (BANCO_*);
//  * gera relatório JSON + Markdown e registra um lote (tipo LEGADO) em importacao_lote.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import {
  carregarJanelaLegada, conjuntosPorCurso, normalizarRegistro, analisarOrigem, chaveNaturalDisciplina,
  horaParaTime, limparTexto, chaveDocente, SALAS_CATALOGO_BSI,
} from './lib/legado.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opcao = (nome, padrao) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : padrao; };
const simular = args.includes('--simular');
const dirDados = path.resolve(opcao('--dados', path.join(aqui, '..', 'dados-legados')));
const dirRelatorio = path.resolve(opcao('--relatorio', path.join(aqui, 'relatorios')));

function exigirVar(nome) {
  const v = process.env[nome];
  if (!v) { console.error(`Variável de ambiente obrigatória ausente: ${nome} (veja .env.example)`); process.exit(2); }
  return v;
}

async function main() {
  const janela = carregarJanelaLegada(dirDados);
  const conjuntos = conjuntosPorCurso(janela);
  const ementasOrigem = janela.BSI_EMENTAS || {};

  const conexao = await mysql.createConnection({
    host: process.env.BANCO_HOST || '127.0.0.1', port: +(process.env.BANCO_PORTA || 3306),
    database: exigirVar('BANCO_NOME'), user: exigirVar('BANCO_USUARIO'), password: exigirVar('BANCO_SENHA'),
    charset: 'utf8mb4', timezone: 'Z',
    // Bancos gerenciados na nuvem exigem TLS: BANCO_SSL_CA = caminho do certificado da CA do provedor.
    ...(process.env.BANCO_SSL_CA ? { ssl: { ca: fs.readFileSync(process.env.BANCO_SSL_CA, 'utf8'), rejectUnauthorized: true } } : {}),
  });
  const q = async (sql, params = []) => (await conexao.execute(sql, params))[0];

  const cursos = await q('SELECT c.id, c.codigo, c.centro_id, ce.sigla AS centro FROM curso c JOIN centro ce ON ce.id = c.centro_id');
  const cursoPorCodigo = Object.fromEntries(cursos.map((c) => [c.codigo, c]));
  const centroDoCurso = Object.fromEntries(cursos.map((c) => [c.codigo, c.centro]));
  const [periodo] = await q("SELECT id FROM periodo_letivo WHERE codigo = '2026/2'");
  if (!periodo) throw new Error("Período letivo '2026/2' ausente: rode as migrações Flyway antes (V2).");

  const analise = analisarOrigem(conjuntos, centroDoCurso);
  const relatorio = {
    iniciadoEm: new Date().toISOString(), modo: simular ? 'simulacao' : 'gravacao', origem: dirDados,
    origemResumo: analise.resumo, anomalias: analise.anomalias,
    conflitosDeSalaNaOrigem: { total: analise.conflitos.length, amostra: analise.conflitos.slice(0, 15) },
    cursos: {}, ementas: {}, descartes: [
      { campo: 'programa', motivo: 'redundante com o curso (ibio-*); não migrado' },
      { campo: 'day_label/day_short', motivo: 'derivados de dia_semana; recalculados na leitura' },
      { campo: 'localStorage (bussola_*)', motivo: 'dados do navegador não são importados indiscriminadamente; ver docs/migracao-de-dados.md' },
      { campo: 'usuários e senhas do auth.js', motivo: 'credenciais de demonstração em texto puro; não migradas' },
    ],
  };

  await conexao.beginTransaction();
  try {
    const cacheDocente = new Map();
    const docenteId = async (nome) => {
      if (!nome) return null;
      const nn = chaveDocente(nome);
      if (cacheDocente.has(nn)) return cacheDocente.get(nn);
      await q('INSERT IGNORE INTO docente (nome, nome_normalizado) VALUES (?, ?)', [nome, nn]);
      const [d] = await q('SELECT id FROM docente WHERE nome_normalizado = ?', [nn]);
      cacheDocente.set(nn, d.id); return d.id;
    };
    const cacheSala = new Map();
    const salaId = async (curso, nome) => {
      const k = `${curso.centro_id}|${nome}`;
      if (!cacheSala.has(k)) {
        await q('INSERT IGNORE INTO sala (centro_id, nome) VALUES (?, ?)', [curso.centro_id, nome]);
        const [s] = await q('SELECT id FROM sala WHERE centro_id = ? AND nome = ?', [curso.centro_id, nome]);
        cacheSala.set(k, s.id);
      }
      const [jaNoCatalogo] = await q('SELECT 1 AS ok FROM curso_sala WHERE curso_id = ? AND sala_id = ?', [curso.id, cacheSala.get(k)]);
      if (!jaNoCatalogo) {
        const [m] = await q('SELECT COALESCE(MAX(ordem), 0) AS maior FROM curso_sala WHERE curso_id = ?', [curso.id]);
        await q('INSERT INTO curso_sala (curso_id, sala_id, ordem) VALUES (?, ?, ?)', [curso.id, cacheSala.get(k), Number(m.maior) + 1]);
      }
      return cacheSala.get(k);
    };
    const disciplinaId = async (curso, d) => {
      if (!d) return null;
      const chave = chaveNaturalDisciplina(curso.codigo, d.matriz, d);
      await q(`INSERT IGNORE INTO disciplina (curso_id, matriz, sigla, codigo, nome, periodo_curricular, pos_graduacao, chave_natural)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [curso.id, d.matriz, d.sigla, d.codigo, d.nome, d.periodo, d.pos ? 1 : 0, chave]);
      const [r] = await q('SELECT id FROM disciplina WHERE chave_natural = ?', [chave]);
      return r.id;
    };

    for (const [codigo, registros] of Object.entries(conjuntos)) {
      const curso = cursoPorCodigo[codigo];
      if (!curso) { relatorio.cursos[codigo] = { erro: 'curso inexistente no banco' }; continue; }
      const rel = { lidas: registros.length, criadas: 0, jaExistiam: 0, horariosCriados: 0, salasNoCatalogo: 0 };
      if (codigo === 'bsi') for (const nome of SALAS_CATALOGO_BSI) await salaId(curso, nome);
      for (const r of registros) {
        const t = normalizarRegistro(codigo, r);
        if (!t.d2023 && !t.d2008) { (rel.rejeitadas ||= []).push({ idLegado: r.id, motivo: 'sem disciplina' }); continue; }
        const [existente] = await q('SELECT id FROM turma WHERE curso_id = ? AND id_legado = ?', [curso.id, t.idLegado]);
        if (existente) { rel.jaExistiam++; continue; }
        const id23 = await disciplinaId(curso, t.d2023);
        const id08 = await disciplinaId(curso, t.d2008);
        const docId = await docenteId(t.professor);
        const sId = t.sala ? await salaId(curso, t.sala) : null;
        const res = await q(
          `INSERT INTO turma (curso_id, periodo_letivo_id, disciplina_2023_id, disciplina_2008_id, docente_id, sala_id, vagas, secao, ementa_url, aviso, origem, id_legado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'legado', ?)`,
          [curso.id, periodo.id, id23, id08, docId, sId, t.vagas, t.secao, t.ementaUrl, t.aviso, t.idLegado]);
        for (const h of t.horarios) {
          await q('INSERT INTO turma_horario (turma_id, dia_semana, hora_inicio, hora_fim) VALUES (?, ?, ?, ?)',
            [res.insertId, h.dia, horaParaTime(h.inicio), horaParaTime(h.fim)]);
          rel.horariosCriados++;
        }
        rel.criadas++;
      }
      const [cs] = await q('SELECT COUNT(*) AS n FROM curso_sala WHERE curso_id = ?', [curso.id]);
      rel.salasNoCatalogo = cs.n;
      // Conferência: o que está no banco bate com a origem?
      const [conf] = await q(`SELECT COUNT(DISTINCT t.id) AS turmas, COUNT(h.id) AS horarios
                              FROM turma t LEFT JOIN turma_horario h ON h.turma_id = t.id
                              WHERE t.curso_id = ? AND t.origem = 'legado' AND t.excluida_em IS NULL`, [curso.id]);
      rel.conferencia = { turmasNoBanco: conf.turmas, horariosNoBanco: conf.horarios,
        turmasNaOrigem: registros.length, horariosNaOrigem: analise.resumo[codigo].horarios,
        confere: (conf.turmas === registros.length && conf.horarios === analise.resumo[codigo].horarios) || rel.jaExistiam > 0 };
      relatorio.cursos[codigo] = rel;
    }

    // Ementas: insere as ausentes; não sobrescreve texto já existente.
    let novas = 0, existentes = 0, divergentes = 0;
    for (const [cod, e] of Object.entries(ementasOrigem)) {
      const [ex] = await q('SELECT texto FROM ementa WHERE codigo = ?', [cod]);
      if (!ex) { await q('INSERT INTO ementa (codigo, nome, texto) VALUES (?, ?, ?)', [cod, limparTexto(e.nome), String(e.ementa || '').trim()]); novas++; }
      else { existentes++; if (ex.texto !== String(e.ementa || '').trim()) divergentes++; }
    }
    relatorio.ementas = { naOrigem: Object.keys(ementasOrigem).length, inseridas: novas, jaExistiam: existentes, textoDivergenteMantido: divergentes };

    const totalLidas = Object.values(relatorio.cursos).reduce((s, c) => s + (c.lidas || 0), 0);
    const totalCriadas = Object.values(relatorio.cursos).reduce((s, c) => s + (c.criadas || 0), 0);
    relatorio.finalizadoEm = new Date().toISOString();
    relatorio.totais = { lidas: totalLidas, criadas: totalCriadas,
      conferenciaOk: Object.values(relatorio.cursos).every((c) => c.conferencia?.confere !== false) };
    if (!simular) {
      await q(`INSERT INTO importacao_lote (tipo, situacao, observacao, total_linhas, total_ok, total_erro, total_criadas, relatorio_json, aplicado_em)
               VALUES ('LEGADO', 'APLICADO', ?, ?, ?, 0, ?, ?, NOW(3))`,
        ['Importação dos dados do painel estático original', totalLidas, totalLidas, totalCriadas, JSON.stringify(relatorio)]);
      await conexao.commit();
    } else {
      await conexao.rollback();
    }
  } catch (e) {
    await conexao.rollback();
    throw e;
  } finally {
    await conexao.end();
  }

  fs.mkdirSync(dirRelatorio, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, '-');
  const base = path.join(dirRelatorio, `importacao-legada-${simular ? 'simulacao-' : ''}${carimbo}`);
  fs.writeFileSync(`${base}.json`, JSON.stringify(relatorio, null, 2));
  fs.writeFileSync(`${base}.md`, relatorioMarkdown(relatorio));
  console.log(relatorioMarkdown(relatorio));
  console.log(`\nRelatório salvo em: ${base}.{json,md}`);
  if (!relatorio.totais.conferenciaOk) process.exitCode = 3;
}

function relatorioMarkdown(r) {
  const l = [];
  l.push(`# Relatório de importação de dados legados (${r.modo})`, '', `- Início: ${r.iniciadoEm}`, `- Fim: ${r.finalizadoEm}`, `- Origem: \`${r.origem}\``,
    `- Total lido: **${r.totais.lidas}** turmas · criadas nesta execução: **${r.totais.criadas}** · conferência: **${r.totais.conferenciaOk ? 'OK' : 'DIVERGENTE'}**`, '',
    '## Por curso', '', '| Curso | Lidas | Criadas | Já existiam | Horários criados | Salas no catálogo | Confere |', '|---|---:|---:|---:|---:|---:|:--:|');
  for (const [c, x] of Object.entries(r.cursos)) l.push(`| ${c} | ${x.lidas ?? '-'} | ${x.criadas ?? '-'} | ${x.jaExistiam ?? '-'} | ${x.horariosCriados ?? '-'} | ${x.salasNoCatalogo ?? '-'} | ${x.conferencia?.confere ? 'sim' : 'NÃO'} |`);
  l.push('', '## Qualidade da origem', '', '| Curso | Turmas | Horários | Sem horário | Sem sala | Sem professor |', '|---|---:|---:|---:|---:|---:|');
  for (const [c, x] of Object.entries(r.origemResumo)) l.push(`| ${c} | ${x.turmas} | ${x.horarios} | ${x.semHorario} | ${x.semSala} | ${x.semProfessor} |`);
  l.push('', `Conflitos de sala (mesma sala, mesmo centro, horários sobrepostos) na origem: **${r.conflitosDeSalaNaOrigem.total}** — importados como estão e apontados aqui para correção pela coordenação.`);
  if (r.anomalias.length) { l.push('', '## Anomalias', ''); for (const a of r.anomalias) l.push(`- ${a.curso}: ${a.tipo} (${a.quantidade})${a.tratamento ? ' — ' + a.tratamento : ''}`); }
  l.push('', '## Ementas', '', `Na origem: ${r.ementas.naOrigem} · inseridas: ${r.ementas.inseridas} · já existiam: ${r.ementas.jaExistiam} · texto divergente (mantido o do banco): ${r.ementas.textoDivergenteMantido}`);
  l.push('', '## Não migrado (de propósito)', ''); for (const d of r.descartes) l.push(`- \`${d.campo}\`: ${d.motivo}`);
  return l.join('\n');
}

main().catch((e) => { console.error('Falha na importação:', e.message); process.exit(1); });
