import { describe, expect, it } from 'vitest';
import { interpretarDashboard } from '../shared/lib/dashboardExterno';

describe('dashboard externo da aba Painel', () => {
  it('vazio ou inválido não configura nada', () => {
    expect(interpretarDashboard('')).toBeNull();
    expect(interpretarDashboard('não é url')).toBeNull();
    expect(interpretarDashboard('http://lookerstudio.google.com/reporting/abc')).toBeNull(); // só https
    expect(interpretarDashboard('javascript:alert(1)')).toBeNull();
  });

  it('Looker Studio: converte o link de relatório no link de incorporação', () => {
    const d = interpretarDashboard('https://lookerstudio.google.com/reporting/abc-123/page/p_x');
    expect(d?.link).toBe('https://lookerstudio.google.com/reporting/abc-123/page/p_x');
    expect(d?.incorporacao).toBe('https://lookerstudio.google.com/embed/reporting/abc-123/page/p_x');
  });

  it('Looker Studio: link de incorporação é mantido', () => {
    const url = 'https://lookerstudio.google.com/embed/reporting/abc-123/page/p_x';
    expect(interpretarDashboard(url)?.incorporacao).toBe(url);
  });

  it('Google Sheets: só incorpora quando publicado na web', () => {
    expect(interpretarDashboard('https://docs.google.com/spreadsheets/d/e/X/pubhtml')?.incorporacao).not.toBeNull();
    expect(interpretarDashboard('https://docs.google.com/spreadsheets/d/X/edit')?.incorporacao).toBeNull();
  });

  it('outros sites https viram apenas link (sem iframe)', () => {
    const d = interpretarDashboard('https://exemplo.org/meu-dashboard');
    expect(d).toEqual({ link: 'https://exemplo.org/meu-dashboard', incorporacao: null });
  });
});
