import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

/** Renderiza com um QueryClient novo por teste, sem novas tentativas (falhas aparecem na hora). */
export function renderizar(ui: ReactElement): RenderResult {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={cliente}>{ui}</QueryClientProvider>);
}
