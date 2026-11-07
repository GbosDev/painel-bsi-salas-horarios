import { z } from 'zod';
import { senhaNova } from '../../autenticacao/types/schemas';

/** "2026 100.101-1" → "20261001011" (mesma regra do backend: ServicoDeUsuarios.normalizarMatricula). */
export function normalizarMatricula(bruta: string): string {
  return bruta.replace(/[\s./-]/g, '');
}

/**
 * Espelha ServicoDeUsuarios/PoliticaDeSenha no backend:
 * - Estudante: matrícula (só dígitos, 5 a 20) e nome obrigatórios; a matrícula é o login.
 * - Professor: login a-z 0-9 . _ - (3 a 60) e nome obrigatórios.
 * - Senha ≠ login.
 */
export const esquemaNovoUsuario = z
  .object({
    login: z.string().trim().toLowerCase(),
    nome: z.string().trim().min(1, 'Informe o nome completo.').max(150, 'No máximo 150 caracteres.'),
    senha: senhaNova,
    perfil: z.enum(['ALUNO', 'PROFESSOR']),
    matricula: z.string().trim(),
  })
  .superRefine((d, ctx) => {
    if (d.perfil === 'ALUNO') {
      const m = normalizarMatricula(d.matricula);
      if (!m) ctx.addIssue({ code: 'custom', path: ['matricula'], message: 'Informe a matrícula: ela será o login.' });
      else if (!/^\d{5,20}$/.test(m))
        ctx.addIssue({ code: 'custom', path: ['matricula'], message: 'A matrícula deve ter só números (5 a 20).' });
      else if (d.senha === m)
        ctx.addIssue({ code: 'custom', path: ['senha'], message: 'A senha não pode ser igual à matrícula.' });
      return;
    }
    if (d.login.length < 3 || d.login.length > 60)
      ctx.addIssue({ code: 'custom', path: ['login'], message: 'O login precisa ter de 3 a 60 caracteres.' });
    else if (!/^[a-z0-9._-]+$/.test(d.login))
      ctx.addIssue({
        code: 'custom',
        path: ['login'],
        message: 'Use só letras minúsculas sem acento, números, ponto, hífen ou sublinhado.',
      });
    else if (d.senha.toLowerCase() === d.login)
      ctx.addIssue({ code: 'custom', path: ['senha'], message: 'A senha não pode ser igual ao login.' });
  });
export type DadosDeNovoUsuario = z.infer<typeof esquemaNovoUsuario>;

/** "Maria José da Silva" → "maria.silva" (sugestão de login; o professor pode editar). */
export function sugerirLogin(nome: string): string {
  const partes = nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 0 && !['da', 'de', 'do', 'das', 'dos', 'e'].includes(p));
  const primeiro = partes[0];
  if (!primeiro) return '';
  const ultimo = partes[partes.length - 1];
  const login = partes.length === 1 || !ultimo ? primeiro : `${primeiro}.${ultimo}`;
  return login.slice(0, 60);
}

/** Senha inicial aleatória que cumpre a política (12 caracteres, letras e números, sem caracteres ambíguos). */
export function gerarSenhaInicial(tamanho = 12): string {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const numeros = '23456789';
  const todos = letras + numeros;
  const aleatorio = (n: number) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] ?? 0) % n;
  };
  const chars = [letras.charAt(aleatorio(letras.length)), numeros.charAt(aleatorio(numeros.length))];
  while (chars.length < tamanho) chars.push(todos.charAt(aleatorio(todos.length)));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    const tmp = chars[i] as string;
    chars[i] = chars[j] as string;
    chars[j] = tmp;
  }
  return chars.join('');
}
