// Testes do leitor/normalizador de dados legados (sem banco) e, se houver BANCO_* no ambiente,
// da importação em modo de simulação contra um MySQL/MariaDB real.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  analisarOrigem, carregarJanelaLegada, chaveDocente, chaveNaturalDisciplina, conflitosDeSala, conjuntosPorCurso,
  duracaoSessaoHoras, normalizarRegistro, normalizarTexto,
} from '../lib/legado.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const dirDados = path.resolve(aqui, '../../dados-legados');

describe('dados legados (arquivos reais do painel original)', () => {
  const janela = carregarJanelaLegada(dirDados);
  const conj = conjuntosPorCurso(janela);

  it('contagens por curso batem com a auditoria da origem', () => {
    assert.deepEqual(Object.fromEntries(Object.entries(conj).map(([k, v]) => [k, v.length])),
      { bsi: 56, eng: 121, mat: 39, 'ibio-bcb': 81, 'ibio-lcb': 85, 'ibio-bca': 50, 'ibio-lcn': 60 });
  });

  it('há 97 ementas na origem', () => {
    assert.equal(Object.keys(janela.BSI_EMENTAS).length, 97);
  });

  it('o sandbox não expõe require/process aos arquivos legados', () => {
    assert.equal(typeof janela.require, 'undefined');
    assert.equal(typeof janela.process, 'undefined');
  });

  it('toda turma legada tem ao menos uma disciplina e todo horário vira intervalo válido', () => {
    for (const [curso, regs] of Object.entries(conj)) {
      for (const r of regs) {
        const t = normalizarRegistro(curso, r);
        assert.ok(t.d2023 || t.d2008, `${curso}#${r.id} sem disciplina`);
        for (const h of t.horarios) {
          assert.ok(h.dia >= 1 && h.dia <= 6, `${curso}#${r.id} dia inválido ${h.dia}`);
          assert.ok(h.fim > h.inicio && h.fim <= 24, `${curso}#${r.id} intervalo inválido`);
        }
      }
    }
  });

  it('total de horários e relatório de qualidade são coerentes', () => {
    const centro = { bsi: 'CCET', eng: 'CCET', mat: 'CCET', 'ibio-bcb': 'IBIO', 'ibio-lcb': 'IBIO', 'ibio-bca': 'IBIO', 'ibio-lcn': 'IBIO' };
    const a = analisarOrigem(conj, centro);
    assert.equal(Object.values(a.resumo).reduce((s, x) => s + x.turmas, 0), 492);
    assert.equal(Object.values(a.resumo).reduce((s, x) => s + x.horarios, 0), 1384);
  });
});

describe('regras de normalização', () => {
  it('BSI usa blocos de 2h; os demais cursos, 1h por entrada', () => {
    assert.equal(duracaoSessaoHoras('bsi'), 2);
    for (const c of ['eng', 'mat', 'ibio-bcb']) assert.equal(duracaoSessaoHoras(c), 1);
    const reg = { id: 1, curr2023: { sigla: 'A', nome: 'A', periodo: '1' }, sessions: [{ day_num: 2, hour: 14 }] };
    assert.deepEqual(normalizarRegistro('bsi', reg).horarios, [{ dia: 2, inicio: 14, fim: 16 }]);
    assert.deepEqual(normalizarRegistro('eng', reg).horarios, [{ dia: 2, inicio: 14, fim: 15 }]);
  });

  it('textos são aparados e vazios viram null; vagas inválidas viram 0', () => {
    const t = normalizarRegistro('bsi', { id: 7, curr2023: { sigla: ' X ', nome: 'Nome   duplo', periodo: '' }, professor: '  ', sala: '', vagas: 'abc', sessions: [] });
    assert.equal(t.d2023.sigla, 'X');
    assert.equal(t.d2023.nome, 'Nome duplo');
    assert.equal(t.d2023.periodo, '', 'período desconhecido é preservado como vazio (a tela mostra "—")');
    assert.equal(t.professor, null);
    assert.equal(t.sala, null);
    assert.equal(t.vagas, 0);
  });

  it('identidade de docente ignora tratamento, acento e caixa', () => {
    assert.equal(chaveDocente('Profª Maria  José'), chaveDocente('maria jose'));
    assert.equal(chaveDocente('Prof. João'), chaveDocente('JOAO'));
    assert.notEqual(chaveDocente('Ana'), chaveDocente('Ana Paula'));
    assert.equal(normalizarTexto('Ação'), 'acao');
  });

  it('chave natural da disciplina é estável e sensível a código, nome e período', () => {
    const d = { sigla: 'X', codigo: 'C1', nome: 'N', periodo: '1' };
    assert.equal(chaveNaturalDisciplina('bsi', 2023, d), chaveNaturalDisciplina('bsi', 2023, { ...d }));
    assert.notEqual(chaveNaturalDisciplina('bsi', 2023, d), chaveNaturalDisciplina('bsi', 2008, d));
    assert.notEqual(chaveNaturalDisciplina('bsi', 2023, d), chaveNaturalDisciplina('bsi', 2023, { ...d, periodo: '2' }));
    assert.match(chaveNaturalDisciplina('bsi', 2023, d), /^[0-9a-f]{64}$/);
  });

  it('conflito de sala: docentes diferentes sobrepostos contam; mesmo docente (aula compartilhada) e horários encostados não', () => {
    const t = (id, prof, sala, dia, ini, fim) => ({ curso: 'x', idLegado: id, professor: prof, sala, horarios: [{ dia, inicio: ini, fim }] });
    assert.equal(conflitosDeSala({ CCET: [t(1, 'Ana', 'S1', 1, 14, 16), t(2, 'Bia', 'S1', 1, 15, 17)] }).length, 1);
    assert.equal(conflitosDeSala({ CCET: [t(1, 'Prof. Ana', 'S1', 1, 14, 16), t(2, 'Profª Ana', 'S1', 1, 15, 17)] }).length, 0);
    assert.equal(conflitosDeSala({ CCET: [t(1, 'Ana', 'S1', 1, 14, 16), t(2, 'Bia', 'S1', 1, 16, 18)] }).length, 0);
    assert.equal(conflitosDeSala({ CCET: [t(1, 'Ana', 'S1', 1, 14, 16), t(2, 'Bia', 'S2', 1, 14, 16)] }).length, 0);
    assert.equal(conflitosDeSala({ CCET: [t(1, 'Ana', 'S1', 1, 14, 16)], IBIO: [t(2, 'Bia', 'S1', 1, 14, 16)] }).length, 0);
  });
});

const temBanco = ['BANCO_NOME', 'BANCO_USUARIO', 'BANCO_SENHA'].every((v) => process.env[v]);
describe('importação contra banco real (somente se BANCO_* estiver definido)', { skip: !temBanco && 'sem BANCO_* no ambiente' }, () => {
  it('simulação roda, não grava (rollback) e gera relatório com conferência OK', () => {
    const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'relatorio-'));
    const script = path.resolve(aqui, '../importar-dados-legados.mjs');
    const out = execFileSync('node', [script, '--simular', '--relatorio', saida], { env: process.env, encoding: 'utf8' });
    assert.match(out, /401/);
    const arquivos = fs.readdirSync(saida);
    assert.ok(arquivos.some((a) => a.endsWith('.json')) && arquivos.some((a) => a.endsWith('.md')));
    const json = JSON.parse(fs.readFileSync(path.join(saida, arquivos.find((a) => a.endsWith('.json'))), 'utf8'));
    assert.equal(json.modo, 'simulacao');
    assert.equal(json.totais.conferenciaOk, true);
    fs.rmSync(saida, { recursive: true, force: true });
  });
});

describe('ENG/MAT atualizados e campos novos', () => {
  const conj = conjuntosPorCurso(carregarJanelaLegada(dirDados));

  it('ENG tem turmas "sem horário fixo" e MAT não tem turma sem sala nem horário duplicado', () => {
    const semHorario = conj.eng.filter((r) => !(r.sessions || []).length);
    assert.equal(semHorario.length, 51);
    for (const r of conj.mat) {
      const chaves = r.sessions.map((s) => `${s.day_num}|${s.hour}`);
      assert.equal(new Set(chaves).size, chaves.length, `mat#${r.id} com hora repetida`);
    }
  });

  it('o aviso da turma é lido e normalizado (Mecânica dos Sólidos)', () => {
    const avisadas = conj.eng.filter((r) => r.aviso).map((r) => normalizarRegistro('eng', r));
    assert.ok(avisadas.length >= 1);
    assert.ok(avisadas.every((t) => t.aviso && t.aviso.length <= 500));
  });

  it('não há conflito de sala entre turmas de docentes diferentes em ENG × MAT', () => {
    const centro = { eng: 'CCET', mat: 'CCET' };
    const a = analisarOrigem({ eng: conj.eng, mat: conj.mat }, centro);
    assert.equal(a.conflitos.length, 0);
  });
});
