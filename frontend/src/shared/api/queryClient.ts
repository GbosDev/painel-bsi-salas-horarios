import { QueryClient } from '@tanstack/react-query';
import { ErroDeApi } from './cliente';

/** Erros 4xx não são repetidos (o resultado seria o mesmo); falhas de rede/5xx tentam mais duas vezes. */
export function criarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (tentativas, erro) =>
          !(erro instanceof ErroDeApi && erro.status >= 400 && erro.status < 500) && tentativas < 2,
      },
    },
  });
}
