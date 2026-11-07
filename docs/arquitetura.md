# Arquitetura

## Visão geral

```
navegador ──HTTP(S)──> nginx (frontend/nginx/default.conf.template, porta 8080 não-root)
                         ├── /            arquivos estáticos do React (build do Vite)
                         └── /api/*  ──>  API Spring Boot (porta 8080 interna) ──> MySQL 8.4
```

O nginx serve o front e encaminha `/api` para a API: para o navegador é **uma única origem**; por isso o cookie de sessão `HttpOnly` e o CSRF funcionam sem CORS. Em desenvolvimento o Vite faz o mesmo papel (`server.proxy`). Decisões em [`adr/`](adr/).

## Back-end: monólito modular, hexagonal onde há regra

Um único deploy, módulos por assunto de negócio em `br.unirio.painel`:

| Módulo | Responsabilidade |
|---|---|
| `oferta` | Turmas, horários, painel de leitura, ajuste excepcional (`HorarioDeAula`, `Turma`, `ConflitosDeHorario`) |
| `catalogo` | Cursos, centros, catálogo de salas |
| `importacao` | CSV: análise linha a linha, prévia e aplicação em lote |
| `plano` | Plano de aulas do estudante (valida choques no servidor) |
| `acesso` | Usuários, senhas, login, bloqueio por tentativas, conta inicial |
| `auditoria` | Registro e consulta do histórico |
| `configuracao` | Segurança, CORS, Problem Details, propriedades |
| `compartilhado` | `ErroDeNegocio`, utilitários, porta `ReferenciasDeCurso` |

Camadas dentro de cada módulo: `dominio` (sem Spring/JPA) → `aplicacao` (casos de uso, portas, `@Transactional`) → `infra` (adaptadores JPA/JDBC) e `api` (controllers `/api/v1`, DTOs, `@PreAuthorize`).

**Fronteiras verificadas** por `ArquiteturaTest` (ArchUnit): domínio sem framework, aplicação sem `api`/`infra`, módulos sem ciclos, e sem acesso a `infra`/entidades de outro módulo. Quando dois módulos precisam do mesmo dado (ex.: curso), usa-se uma porta em `compartilhado` (`ReferenciasDeCurso`, implementada em `catalogo.infra`).

## Decisões estruturais

1. **Horários como intervalos reais** (`hora_inicio`, `hora_fim`); duração vem de `curso.duracao_aula_horas`. Conflitos e "agora" usam sobreposição.
2. **Esquema em português `snake_case`**, ver [`dicionario-de-dados.md`](dicionario-de-dados.md).
3. **Flyway é a única fonte do esquema**; `spring.jpa.hibernate.ddl-auto=validate`. O `pom.xml` copia `banco-de-dados/migracoes` para `db/migration` no classpath.
4. **Sessão no servidor + CSRF** (ver [ADR 0003](adr/0003-sessao-em-vez-de-jwt.md)).
5. **Concorrência otimista** em `turma.versao`; **exclusão lógica**; **auditoria na mesma transação**.
6. **Importação em duas etapas** (prévia grava só o lote; "Aplicar" altera turmas).
7. **Erros em Problem Details (RFC 9457)** com extensões `codigo` e `detalhes`.

## Front-end

```
src/
  app/          App, Casca (layout), rotas com React.lazy
  features/     <modulo>/{components,hooks,api,types}
                atualizar-dados autenticacao cursos disciplinas grade historico painel plano salas turmas usuarios
  shared/       api (cliente HTTP único e tipado, QueryClient), contexto, lib (domínio puro), ui (estados, toasts, tabela empilhável), estilos (tokens.css, painel.css, extras.css)
  testes/       Vitest + Testing Library
e2e/            Playwright
```

* Estado do servidor: **TanStack Query**; formulários: **React Hook Form + Zod**; sem `any`.
* Abas são rotas (`/curso/:codigo/:aba`), carregadas sob demanda (code splitting).
* Todo componente de dados trata carregando (skeleton), erro (com "Tentar de novo"), vazio (com orientação) e sucesso.
* Visual: tokens CSS (cor, espaço, raio, sombra, movimento), mobile-first, `prefers-reduced-motion` respeitado. Em telas estreitas, tabelas viram cartões (`TabelaEmpilhavel`) e o seletor de dia vira chips.
* A visibilidade de abas por perfil é conveniência; **a autorização real está no servidor**.
