import { useQuery } from '@tanstack/react-query';

/**
 * Configuração lida em TEMPO DE EXECUÇÃO (não no build): o mesmo bundle serve dev e produção.
 * - Desenvolvimento (npm run dev): o Vite gera /config.json a partir do .env da raiz (vite.config.ts).
 * - Docker/produção: o nginx gera /config.json a partir das variáveis do container (nginx/default.conf.template).
 */
export interface ConfiguracaoDoFront {
  /** Link do dashboard externo (ex.: Google Looker Studio) exibido na aba "Painel". Vazio = não configurado. */
  painelDashboardUrl: string;
}

const PADRAO: ConfiguracaoDoFront = { painelDashboardUrl: '' };

export async function carregarConfiguracao(): Promise<ConfiguracaoDoFront> {
  const resposta = await fetch('/config.json', { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!resposta.ok) return PADRAO;
  const dados = (await resposta.json()) as Partial<ConfiguracaoDoFront>;
  return { painelDashboardUrl: typeof dados.painelDashboardUrl === 'string' ? dados.painelDashboardUrl.trim() : '' };
}

export function useConfiguracao() {
  return useQuery({ queryKey: ['configuracao'], queryFn: carregarConfiguracao, staleTime: Infinity });
}
