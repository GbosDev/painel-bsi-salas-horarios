import { describe, expect, it } from 'vitest';
import { buscarTurmas } from '../shared/lib/busca';
import { celulaTemConflito, celulasEmConflito, encontrarConflitos } from '../shared/lib/conflitos';
import {
  agoraDe,
  deMinutos,
  inicioPadrao,
  ocupacaoDaSala,
  opcoesDeInicio,
  paraMinutos,
  relogioTexto,
  sobrepoe,
  turmaEmAula,
} from '../shared/lib/horarios';
import { gerarModeloCsv, horarioCsv, linhaDaTurma, linhasDeExemploDoCurso } from '../shared/lib/modeloCsv';
import { resumoDaMudanca } from '../shared/lib/auditoria';
import { achatarDisciplinas, profCurto, rotuloDaTurma } from '../shared/lib/rotulos';
import { disc, hor, turma } from './fabrica';

describe('horários', () => {
  it('converte HH:mm em minutos e de volta', () => {
    expect(paraMinutos('14:00')).toBe(840);
    expect(paraMinutos('14:30:00')).toBe(870);
    expect(deMinutos(870)).toBe('14:30');
  });

  it('intervalos que apenas se tocam não se sobrepõem', () => {
    expect(sobrepoe(840, 960, 960, 1080)).toBe(false);
    expect(sobrepoe(840, 960, 900, 1000)).toBe(true);
  });

  it('detecta aula em andamento com intervalo real (fim exclusivo)', () => {
    const t = turma({ horarios: [hor(2, '14:00', '16:00')] });
    expect(turmaEmAula(t, { dia: 2, minutos: 14 * 60 })).toBe(true);
    expect(turmaEmAula(t, { dia: 2, minutos: 15 * 60 + 59 })).toBe(true);
    expect(turmaEmAula(t, { dia: 2, minutos: 16 * 60 })).toBe(false);
    expect(turmaEmAula(t, { dia: 3, minutos: 14 * 60 })).toBe(false);
  });

  it('aula de 1h (ENG/IBIO) não "vaza" para a hora seguinte, ao contrário do painel antigo', () => {
    const t = turma({ horarios: [hor(1, '16:00', '17:00')] });
    expect(turmaEmAula(t, { dia: 1, minutos: 17 * 60 })).toBe(false);
  });

  it('agoraDe mapeia domingo para 7 e o relógio diz "sem aulas"', () => {
    const domingo = new Date(2026, 9, 25, 10, 5); // 25/10/2026 é domingo
    expect(agoraDe(domingo)).toEqual({ dia: 7, minutos: 605 });
    expect(relogioTexto(agoraDe(domingo))).toBe('Domingo · sem aulas');
    expect(relogioTexto({ dia: 3, minutos: 14 * 60 + 5 })).toBe('QUA · 14:05');
  });

  it('opções de início: BSI usa os inícios existentes; 1h preenche todas as horas', () => {
    const bsi = [turma({ horarios: [hor(1, '08:00', '10:00'), hor(1, '14:00', '16:00')] })];
    expect(opcoesDeInicio(bsi, 2)).toEqual([8, 14]);
    expect(opcoesDeInicio(bsi, 1)).toEqual([8, 9, 10, 11, 12, 13, 14]);
    expect(opcoesDeInicio([], 1)).toEqual([]);
  });

  it('início padrão é a última faixa que já começou', () => {
    expect(inicioPadrao([8, 14, 16, 18], { dia: 1, minutos: 15 * 60 })).toBe(14);
    expect(inicioPadrao([8, 14, 16, 18], { dia: 1, minutos: 6 * 60 })).toBe(8);
  });

  it('ocupação da sala usa sobreposição real do intervalo', () => {
    const t = turma({ sala: 'Lab. 1', horarios: [hor(2, '14:00', '16:00')] });
    expect(ocupacaoDaSala([t], 'Lab. 1', 2, 15 * 60, 16 * 60)).toBe(t);
    expect(ocupacaoDaSala([t], 'Lab. 1', 2, 16 * 60, 18 * 60)).toBeNull();
    expect(ocupacaoDaSala([t], 'Lab. 2', 2, 14 * 60, 16 * 60)).toBeNull();
  });
});

describe('conflitos de plano', () => {
  it('não há conflito entre horários consecutivos', () => {
    const a = turma({ horarios: [hor(1, '14:00', '16:00')] });
    const b = turma({ horarios: [hor(1, '16:00', '18:00')] });
    expect(encontrarConflitos([a, b])).toEqual([]);
  });

  it('conflito entre aula de 2h e aula de 1h que começa na segunda hora', () => {
    const a = turma({ horarios: [hor(3, '16:00', '18:00')] });
    const b = turma({ horarios: [hor(3, '17:00', '18:00')] });
    const c = encontrarConflitos([a, b]);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ dia: 3, inicio: 17 * 60, fim: 18 * 60 });
    expect(c[0]?.turmas.map((t) => t.id)).toEqual([a.id, b.id]);
  });

  it('agrupa três turmas no mesmo trecho em um único conflito', () => {
    const t = [1, 2, 3].map(() => turma({ horarios: [hor(2, '08:00', '10:00')] }));
    const c = encontrarConflitos(t);
    expect(c).toHaveLength(1);
    expect(c[0]?.turmas).toHaveLength(3);
  });

  it('marca as células da grade afetadas', () => {
    const a = turma({ horarios: [hor(2, '16:00', '18:00')] });
    const b = turma({ horarios: [hor(2, '17:00', '19:00')] });
    const celulas = celulasEmConflito(encontrarConflitos([a, b]));
    expect([...celulas]).toEqual(['2|17']);
  });

  it('célula de 2h (16–18) é marcada quando o choque está só na segunda hora', () => {
    const a = turma({ horarios: [hor(2, '16:00', '18:00')] });
    const b = turma({ horarios: [hor(2, '17:00', '19:00')] });
    const c = encontrarConflitos([a, b]);
    expect(celulaTemConflito(c, 2, 16 * 60, 18 * 60)).toBe(true);
    expect(celulaTemConflito(c, 2, 18 * 60, 20 * 60)).toBe(false);
    expect(celulaTemConflito(c, 3, 16 * 60, 18 * 60)).toBe(false);
  });
});

describe('rótulos e busca', () => {
  const t = turma({
    curr2008: disc('OLD', 'Antiga'),
    curr2023: disc('NEW', 'Nova'),
    professor: 'Profª Maria',
    sala: 'Lab. 3',
  });

  it('respeita a grade preferida e cai para a que existe', () => {
    expect(rotuloDaTurma(t, '2008').sigla).toBe('OLD');
    expect(rotuloDaTurma(t, '2023').sigla).toBe('NEW');
    const so08 = turma({ curr2023: null, curr2008: disc('S08') });
    expect(rotuloDaTurma(so08, '2023').sigla).toBe('S08');
  });

  it('remove o título do professor', () => {
    expect(profCurto('Profª Maria')).toBe('Maria');
    expect(profCurto('Prof. João')).toBe('João');
    expect(profCurto(null)).toBe('');
  });

  it('achata uma linha por grade presente', () => {
    expect(achatarDisciplinas([t])).toHaveLength(2);
  });

  it('busca informa o motivo do match', () => {
    const lista = [t];
    expect(buscarTurmas(lista, 'maria')[0]?.tipo).toBe('professor');
    expect(buscarTurmas(lista, 'lab. 3')[0]?.tipo).toBe('sala');
    expect(buscarTurmas(lista, 'new')[0]?.tipo).toBe('sigla');
    expect(buscarTurmas(lista, 'antiga')[0]?.tipo).toBe('disciplina');
    expect(buscarTurmas(lista, '   ')).toEqual([]);
    expect(buscarTurmas(lista, 'zzz')).toEqual([]);
  });
});

describe('modelo CSV e histórico', () => {
  it('modelo tem o cabeçalho esperado e linhas de exemplo', () => {
    const csv = gerarModeloCsv().trim().split('\n');
    expect(csv[0]).toBe(
      'Id,SiglaAntiga,DisciplinaAntiga,CodigoAntiga,PeriodoAntiga,SiglaAtual,DisciplinaAtual,CodigoAtual,PeriodoAtual,Professor,Horario1,Horario2,Sala,Vagas',
    );
    expect(csv).toHaveLength(3);
  });

  it('horário no formato da planilha oficial (2ª = segunda)', () => {
    expect(horarioCsv(hor(2, '14:00:00', '16:00:00'))).toBe('3ª 14h-16h');
    expect(horarioCsv(hor(6, '08:30', '10:00'))).toBe('7ª 08h30-10h');
  });

  it('exemplo usa turmas reais do curso de destino, priorizando as completas e nas duas grades', () => {
    const incompleta = turma({ curr2023: disc('INC'), professor: null, horarios: [] });
    const soAtual = turma({ curr2023: disc('BIO1', 'Biologia Celular'), horarios: [hor(1, '08:00', '10:00')] });
    const duasGrades = turma({
      curr2008: disc('ZOO', 'Zoologia'),
      curr2023: disc('ZOO2', 'Zoologia II'),
      horarios: [hor(3, '14:00', '16:00'), hor(5, '14:00', '16:00')],
    });
    const linhas = linhasDeExemploDoCurso([incompleta, soAtual, duasGrades]);
    expect(linhas).toHaveLength(2);
    expect(linhas[0]!).toEqual(linhaDaTurma(duasGrades));
    expect(linhas[0]!.slice(1, 3)).toEqual(['ZOO', 'Zoologia']);
    expect(linhas[0]![10]).toBe('4ª 14h-16h');
    expect(linhas[0]![11]).toBe('6ª 14h-16h');
    expect(linhas[0]![0]).toBe(String(duasGrades.id));
    expect(linhas[1]![5]).toBe('BIO1');
  });

  it('sem turmas no curso, cai no exemplo genérico', () => {
    expect(linhasDeExemploDoCurso([])[0]![5]).toBe('DISC1');
  });

  it('resume mudanças: alterado, adicionado e removido', () => {
    expect(resumoDaMudanca({ sala: 'A', vagas: 10 }, { sala: 'B', vagas: 10 })).toBe('sala: "A" → "B" · vagas: 10');
    expect(resumoDaMudanca({ sala: 'A' }, {})).toBe('sala (removido): A');
    expect(resumoDaMudanca(null, null)).toBe('—');
  });
});
