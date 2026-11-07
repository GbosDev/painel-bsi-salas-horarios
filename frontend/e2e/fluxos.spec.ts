import { expect, test, type Page } from '@playwright/test';

const conta = (papel: 'PROF' | 'ALUNO') => ({
  login: process.env[`E2E_${papel}_LOGIN`] ?? '',
  senha: process.env[`E2E_${papel}_SENHA`] ?? '',
});

async function entrar(page: Page, papel: 'PROF' | 'ALUNO') {
  const { login, senha } = conta(papel);
  test.skip(!login || !senha, `defina E2E_${papel}_LOGIN e E2E_${papel}_SENHA`);
  await page.goto('/');
  await page.waitForURL('**/login');
  await page.getByLabel('Usuário').fill(login);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/curso/**');
}

async function semRolagemLateral(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sw).toBeLessThanOrEqual(cw + 1);
}

test('sem sessão, redireciona para o login e recusa credenciais erradas', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Usuário').fill('ninguem');
  await page.getByLabel('Senha').fill('senha-errada-123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('validação do formulário de login acontece no próprio campo', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Informe o usuário.')).toBeVisible();
});

test('estudante: grade sem rolagem lateral e plano sem caixa de choques', async ({ page }) => {
  await entrar(page, 'ALUNO');
  await page.goto('/curso/bsi/grade');
  await expect(page.locator('.sb-grid')).toBeVisible();
  await semRolagemLateral(page);
  await page.goto('/curso/bsi/plano');
  await expect(page.locator('.pl-layout')).toBeVisible();
  await expect(page.getByText('choque(s) de horário')).toHaveCount(0);
  await semRolagemLateral(page);
});

test('estudante: não vê abas administrativas', async ({ page }) => {
  await entrar(page, 'ALUNO');
  await expect(page.getByRole('tab', { name: /Atualizar dados/ })).toHaveCount(0);
});

test('professor: ajuste excepcional exige motivo e tem abas Turmas / Catálogo de salas', async ({ page }) => {
  await entrar(page, 'PROF');
  await page.goto('/curso/bsi/csv');
  await page.getByRole('button', { name: /Ajuste excepcional/ }).click();
  const janela = page.getByRole('dialog', { name: 'Ajuste excepcional' });
  await expect(janela).toBeVisible();
  await expect(janela.getByRole('tab', { name: 'Turmas' })).toBeVisible();
  await expect(janela.getByRole('tab', { name: 'Catálogo de salas' })).toBeVisible();
  await janela.getByRole('button', { name: 'Editar' }).first().click();
  await janela.getByRole('button', { name: 'Salvar ajuste' }).click();
  await expect(janela.getByText(/Descreva o motivo/)).toBeVisible();
  await semRolagemLateral(page);
});
