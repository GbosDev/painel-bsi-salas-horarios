# Testes — resultados reais

Números de execuções feitas durante a construção, em ambiente **sem acesso ao Maven Central e sem Docker**.

| Verificação | Resultado | Observação |
|---|---|---|
| Front: `tsc --noEmit` (strict) | sem erros | |
| Front: `eslint .` (jsx-a11y, react-hooks) | sem erros | |
| Front: `prettier --check` | limpo | |
| Front: `vitest run` | **51/51** | domínio, cliente HTTP (CSRF, erros, 401), telas (login, grade, plano com conflito, ajuste, estados) |
| Front: `vite build` | OK | rotas em chunks separados |
| Front: Playwright E2E | **10/10** | Chromium real, contra o Vite + uma **API simulada** (não o backend Spring) |
| Navegador 375 px e 1440 px | conferido | capturas e console sem erros, mesma API simulada |
| Importador: `node --test` | **13/13** | |
| SQL V1–V3 + importação | OK | MariaDB 10.11 (não MySQL 8.4); 492 turmas; segunda execução: 0 criadas, 492 já existiam |
| Núcleo Java (domínio + aplicação) | **49/49** | **fora do Maven**: `javac` com stubs mínimos e executor reflexivo |

## Escritos, mas NÃO executados
* Camada Spring (controllers, segurança, JPA/JDBC, config): nunca compilada.
* `ArquiteturaTest` (ArchUnit) e `MysqlIntegracaoTest` (Testcontainers com MySQL 8.4): escritos, não rodados.
* `./mvnw verify` (inclui os acima), `docker compose up --build`, validação `ddl-auto=validate`, healthchecks, Lighthouse.

## Como reproduzir no seu ambiente
```bash
cd frontend && npm ci && npm run lint && npm run typecheck && npm test && npm run build
cd frontend && npx playwright install chromium && npm run test:e2e   # exige a pilha no ar e E2E_* (ver README)
cd banco-de-dados/ferramentas && npm ci && npm test
cd backend && ./mvnw verify                                      # requer Docker para o teste com Testcontainers
```
