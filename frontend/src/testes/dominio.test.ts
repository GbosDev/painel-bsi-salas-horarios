import { describe, expect, it } from 'vitest';
import { buscarTurmas } from '../shared/lib/busca';
import {
  conflictCellKeys,
  conflictIds,
  findConflicts,
  fmtHour,
  fmtRange,
  getHours,
  overlaps,
} from '../features/plano/lib/planUtils';
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

describe('conflitos de plano (planUtils)', () => {
  const mapa = (...ts: ReturnType<typeof turma>[]) => new Map(ts.map((t) => [t.id, t]));

  it('formata horas e faixas', () => {
    expect(fmtHour(8)).toBe('08:00');
    expect(fmtRange(14, 2)).toBe('14:00–16:00');
  });

  it('sobreposição usa a duração da aula (slot), não só a hora de início', () => {
    expect(overlaps(14, 15, 2)).toBe(true);
    expect(overlaps(14, 16, 2)).toBe(false);
    expect(overlaps(14, 15, 1)).toBe(false);
    expect(overlaps(14, 14, 1)).toBe(true);
  });

  it('BSI (slot 2): 14h e 16h não chocam; 16h e 17h chocam no trecho 17–18', () => {
    const a = turma({ horarios: [hor(3, '16:00', '18:00')] });
    const b = turma({ horarios: [hor(3, '17:00', '19:00')] });
    const c = turma({ horarios: [hor(3, '14:00', '16:00')] });
    const m = mapa(a, b, c);
    expect(findConflicts([c.id, a.id], m, 2)).toEqual([]);
    const lista = findConflicts([a.id, b.id], m, 2);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ day: 3, hour: 17, end: 18, hours: [16, 17] });
    expect([...conflictIds(lista)]).toEqual([a.id, b.id]);
    expect([...conflictCellKeys(lista)]).toEqual(['3-16', '3-17']);
  });

  it('dias diferentes nunca chocam e ids inexistentes são ignorados', () => {
    const a = turma({ horarios: [hor(1, '14:00', '16:00')] });
    const b = turma({ horarios: [hor(2, '14:00', '16:00')] });
    expect(findConflicts([a.id, b.id, 999], mapa(a, b), 2)).toEqual([]);
  });

  it('linhas da grade: BSI tem [8,14,16,18,20] + extras; outros cursos vão de hora em hora', () => {
    const t = [turma({ horarios: [hor(1, '10:00', '12:00')] }), turma({ horarios: [hor(2, '13:00', '14:00')] })];
    expect(getHours(t, 'bsi')).toEqual([8, 10, 13, 14, 16, 18, 20]);
    expect(getHours(t, 'mat')).toEqual([10, 11, 12, 13]);
    expect(getHours([], 'mat')).toEqual([]);
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
