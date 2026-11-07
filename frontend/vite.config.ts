/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Desenvolvimento: serve /config.json (configuração em tempo de execução do front) a partir do .env da raiz.
 * Em Docker/produção quem gera esse arquivo é o nginx (nginx/default.conf.template).
 */
function configuracaoEmTempoDeExecucao(raiz: Record<string, string>): Plugin {
  return {
    name: 'painel-config-json',
    configureServer(servidor) {
      servidor.middlewares.use('/config.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ painelDashboardUrl: raiz.PAINEL_DASHBOARD_URL ?? '' }));
      });
    },
  };
}

// Em desenvolvimento, /api é encaminhado ao backend: para o navegador tudo é a mesma origem,
// então o cookie de sessão HttpOnly e o CSRF funcionam sem CORS.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // PORTA_API e PAINEL_DASHBOARD_URL vêm do .env da raiz (o mesmo que o backend lê ao rodar localmente).
  const raiz = loadEnv(mode, '..', '');
  const alvoApi = env.VITE_API_ALVO || `http://localhost:${raiz.PORTA_API || 8080}`;
  return {
    plugins: [react(), configuracaoEmTempoDeExecucao(raiz)],
    server: {
      port: 5173,
      // Falha em vez de pular para 5174 se a porta estiver ocupada (evita "abri a porta errada").
      strictPort: true,
      proxy: { '/api': { target: alvoApi, changeOrigin: false } },
    },
    build: { sourcemap: false, target: 'es2022' },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/testes/configuracao.ts'],
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      css: false,
    },
  };
});
