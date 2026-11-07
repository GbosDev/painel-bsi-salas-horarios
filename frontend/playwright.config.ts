import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra a pilha real (docker compose up) em E2E_BASE_URL (padrão http://localhost:8083, o front do Docker).
 * Credenciais de teste vêm do ambiente: E2E_PROF_LOGIN/E2E_PROF_SENHA e E2E_ALUNO_LOGIN/E2E_ALUNO_SENHA
 * (contas criadas pelo administrador no ambiente de teste — o projeto não traz contas padrão).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8083',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    // opcional: usar um Chromium já instalado (ex.: E2E_CHROMIUM=/usr/bin/chromium) em vez do baixado por `npx playwright install`
    launchOptions: { executablePath: process.env.E2E_CHROMIUM || undefined },
  },
  projects: [
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    {
      name: 'celular-375',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, hasTouch: true },
    },
  ],
});
