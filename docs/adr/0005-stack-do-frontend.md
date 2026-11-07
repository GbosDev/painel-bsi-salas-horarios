# ADR 0005 — Stack e estrutura do front-end

- Status: aceita
- Data: 2026-11-07

## Contexto
É preciso um front tipado, testável e acessível, sem manter o painel estático antigo.

## Decisão
React 18 + TypeScript estrito + Vite; **TanStack Query** para estado do servidor; **React Hook Form + Zod** em formulários; **um cliente HTTP único e tipado** (CSRF, erros Problem Details, 401); React Router com `React.lazy` por rota; estrutura `src/features/<modulo>/{components,hooks,api,types}` + `src/shared`; tokens em CSS variables; Vitest + Testing Library e Playwright; ESLint (jsx-a11y) + Prettier. Sem `any`. React Bits não foi adotado: nada justificava o custo de animação.

## Consequências
Componentes de dados têm 4 estados e acessibilidade verificada por lint e testes. Redesign moderado: identidade original preservada, com tokens e responsividade.
