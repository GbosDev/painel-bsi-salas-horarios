import { z } from 'zod';

export const MOTIVO_MINIMO = 8;

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida.');

export const esquemaHorario = z
  .object({
    diaSemana: z.number().int().min(1).max(6),
    inicio: hora,
    fim: hora,
  })
  .refine((h) => h.fim > h.inicio, { message: 'O fim precisa ser depois do início.', path: ['fim'] });

const motivo = z
  .string()
  .trim()
  .min(MOTIVO_MINIMO, `Descreva o motivo (mín. ${MOTIVO_MINIMO} caracteres).`)
  .max(500, 'No máximo 500 caracteres.');
const vagas = z
  .number({ error: 'Informe as vagas (0 se não houver limite).' })
  .int('Use um número inteiro.')
  .min(0, 'Não pode ser negativo.')
  .max(1000, 'No máximo 1000.');

/** Os horários podem ficar vazios: turmas "sem horário fixo" (orientação, atividades contínuas) são válidas. */
export const esquemaEdicao = z.object({
  professor: z.string().trim().max(200, 'No máximo 200 caracteres.'),
  sala: z.string(),
  vagas,
  horarios: z.array(esquemaHorario),
  motivo,
});
export type DadosDeEdicao = z.infer<typeof esquemaEdicao>;

export const esquemaNovaTurma = z.object({
  sigla: z.string().trim().min(1, 'Informe a sigla.').max(60, 'No máximo 60 caracteres.'),
  disciplina: z.string().trim().min(1, 'Informe a disciplina.').max(250, 'No máximo 250 caracteres.'),
  codigo: z.string().trim().max(30, 'No máximo 30 caracteres.'),
  periodo: z.string().trim().max(5, 'No máximo 5 caracteres.'),
  professor: z.string().trim().max(200, 'No máximo 200 caracteres.'),
  sala: z.string(),
  vagas,
  horarios: z.array(esquemaHorario),
  motivo,
});
export type DadosDeNovaTurma = z.infer<typeof esquemaNovaTurma>;

export const esquemaExclusao = z.object({ motivo });
export type DadosDeExclusao = z.infer<typeof esquemaExclusao>;

export const esquemaNovaSala = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da sala.').max(60, 'No máximo 60 caracteres.'),
});
export type DadosDeNovaSala = z.infer<typeof esquemaNovaSala>;
