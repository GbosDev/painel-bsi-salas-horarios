import { describe, expect, it } from 'vitest';
import {
  esquemaNovoUsuario,
  gerarSenhaInicial,
  normalizarMatricula,
  sugerirLogin,
} from '../features/usuarios/types/schemas';

describe('cadastro de usuários', () => {
  it('sugere login a partir do nome (sem acentos e sem preposições)', () => {
    expect(sugerirLogin('Maria José da Conceição')).toBe('maria.conceicao');
    expect(sugerirLogin('Ana')).toBe('ana');
    expect(sugerirLogin('Fábio Turma2036')).toBe('fabio.turma2036');
    expect(sugerirLogin('  ')).toBe('');
  });

  it('senha gerada cumpre a política', () => {
    for (let i = 0; i < 50; i++) {
      const s = gerarSenhaInicial();
      expect(s).toHaveLength(12);
      expect(s).toMatch(/[A-Za-z]/);
      expect(s).toMatch(/\d/);
    }
  });

  it('professor: login no formato do backend e senha diferente do login', () => {
    const base = { nome: 'Ana', perfil: 'PROFESSOR' as const, matricula: '' };
    expect(esquemaNovoUsuario.safeParse({ ...base, login: 'Ana.Souza', senha: 'abcdefghij1' }).success).toBe(true);
    expect(esquemaNovoUsuario.safeParse({ ...base, login: 'ana souza', senha: 'abcdefghij1' }).success).toBe(false);
    expect(esquemaNovoUsuario.safeParse({ ...base, login: 'ana12345678', senha: 'ANA12345678' }).success).toBe(false);
  });

  it('estudante: matrícula e nome obrigatórios; matrícula só com números (aceita espaços/pontos digitados)', () => {
    const base = { login: '', perfil: 'ALUNO' as const, senha: 'abcdefghij1' };
    expect(esquemaNovoUsuario.safeParse({ ...base, nome: 'Ana Lima', matricula: '2026 100.101' }).success).toBe(true);
    expect(esquemaNovoUsuario.safeParse({ ...base, nome: 'Ana Lima', matricula: '' }).success).toBe(false);
    expect(esquemaNovoUsuario.safeParse({ ...base, nome: 'Ana Lima', matricula: 'ABC123' }).success).toBe(false);
    expect(esquemaNovoUsuario.safeParse({ ...base, nome: ' ', matricula: '2026100101' }).success).toBe(false);
    expect(normalizarMatricula('2026 100.101-1')).toBe('20261001011');
  });
});
