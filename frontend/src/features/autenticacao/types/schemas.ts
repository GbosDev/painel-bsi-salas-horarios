import { z } from 'zod';

/** Política de senha: espelha PoliticaDeSenha no backend (mín. 10 caracteres, com letras e números). */
export const senhaNova = z
  .string()
  .min(10, 'A senha precisa ter ao menos 10 caracteres.')
  .max(128, 'A senha pode ter no máximo 128 caracteres.')
  .regex(/[A-Za-zÀ-ÿ]/, 'Inclua ao menos uma letra.')
  .regex(/\d/, 'Inclua ao menos um número.');

export const esquemaLogin = z.object({
  login: z.string().trim().min(1, 'Informe o usuário.'),
  senha: z.string().min(1, 'Informe a senha.'),
});
export type DadosDeLogin = z.infer<typeof esquemaLogin>;

export const esquemaAlterarSenha = z.object({
  senhaAtual: z.string().min(1, 'Informe a senha atual.'),
  novaSenha: senhaNova,
});
export type DadosDeAlterarSenha = z.infer<typeof esquemaAlterarSenha>;
