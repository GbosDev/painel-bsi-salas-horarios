# Bússola — Plataforma Acadêmica (CCET x IBIO)

Versão de **homologação**: migração da aplicação estática original (HTML/CSS/JS
com persistência em `localStorage`) para uma arquitetura cliente-servidor real,
com backend em **Spring Boot** (Hexagonal + DDD), frontend em **Angular**, e
persistência poliglota (**MySQL** para o núcleo relacional, **MongoDB** para
dados schema-flexible). Esta branch/pasta é uma versão alternativa ao projeto
estático original, pensada para validação em ambiente de homologação antes de
decidir o caminho definitivo para produção.

## Por que esta migração

A versão estática tinha dois problemas estruturais que a tornavam inadequada
para uso real por múltiplos usuários:

1. **Persistência isolada por navegador.** Edições de professores (`admin.js`,
   `store.js`) eram salvas em `localStorage`, então nunca apareciam para outro
   usuário ou outro dispositivo — cada aluno via um estado diferente do "banco
   de dados".
2. **Autenticação e autorização só no cliente.** `auth.js` guardava usuários e
   senhas em texto puro em um array JS, e o controle de acesso ao Painel/Admin
   era um `if (IS_PROFESSOR)` no navegador — contornável abrindo o console e
   escrevendo em `localStorage`.

Esta versão resolve os dois pontos: o estado agora vive em bancos de dados
reais compartilhados, e toda autorização é validada no servidor via JWT +
Spring Security (`@PreAuthorize`), nunca confiando em uma flag do cliente.

## Arquitetura

```
bussola-platform/
├── backend/   Spring Boot — Hexagonal (Ports & Adapters) + DDD
├── frontend/  Angular 18 (standalone components)
├── infra/     scripts de inicialização do Mongo
└── docker-compose.yml
```

### Backend — Hexagonal / DDD

```
br.com.bussola.backend/
├── domain/            núcleo puro, sem dependência de framework
│   ├── classsession/  agregado raiz "Turma" (ClassSession) + Subject/WeeklySlot
│   ├── course/        agregado "Curso"
│   ├── room/          agregado "Sala"
│   ├── user/          agregado "Usuário"
│   ├── plan/          agregado "Meu plano" (StudyPlan)
│   ├── syllabus/      "Ementa"
│   ├── audit/         log de auditoria de edições
│   └── shared/        exceções de domínio
├── application/       casos de uso (orquestram domínio + portas)
│   ├── auth/, course/, classsession/, room/, plan/, syllabus/
└── infrastructure/
    ├── adapter/in/web/           controllers REST, DTOs, GlobalExceptionHandler
    ├── adapter/out/persistence/mysql/   entidades JPA, repositórios Spring Data, adapters
    ├── adapter/out/persistence/mongo/   documentos Mongo, repositórios, adapters
    ├── security/                 JWT, filtro de autenticação, BCrypt
    └── config/                   CORS, OpenAPI, propriedades
```

O **domínio não importa nada do Spring** — é testável com `javac` puro e
JUnit simples. As portas (`CourseRepository`, `ClassSessionRepository`, etc.)
são interfaces no domínio; os adapters MySQL/Mongo as implementam. Trocar de
MySQL para outro RDBMS, por exemplo, significa escrever um novo adapter — o
domínio e os casos de uso não mudam.

### Por que MySQL *e* MongoDB (poliglota deliberado, não "porque parece
profissional")

| Dado | Banco | Por quê |
|---|---|---|
| Cursos, turmas, salas, usuários | **MySQL** | Domínio relacional de verdade: chaves estrangeiras, integridade referencial, joins (turma → curso, usuário → curso). |
| Ementas (`syllabus`) | **MongoDB** | Texto longo e variável por currículo, nunca normalizado, raramente joinado. |
| Plano de estudos do aluno (`study_plan`) | **MongoDB** | Documento pessoal por usuário, schema solto, sem necessidade de integridade relacional. |
| Log de auditoria de edições (`audit_log`) | **MongoDB** | Append-only, formato de evento, cresce indefinidamente — exatamente o caso de uso para o qual Mongo foi desenhado. |

### Segurança

- Senhas com **BCrypt** (nunca texto puro — ver `V2__seed_data.sql`).
- **JWT** (HS256) emitido no login, validado em todo request via
  `JwtAuthenticationFilter`.
- Autorização por papel com `@PreAuthorize("hasRole('PROFESSOR')")` em cada
  endpoint de escrita (turmas, salas) — a mesma trava que o frontend também
  aplica via `roleGuard`, mas a trava que importa é a do servidor.
- CORS com lista explícita de origens (nunca `*` com `allowCredentials`).
- `GlobalExceptionHandler` padroniza toda resposta de erro em um formato
  único (`ApiError`), para o frontend nunca precisar tratar formatos
  diferentes por endpoint.

### Frontend — Angular

Standalone components, lazy-loaded por rota. Reaproveita os tokens de design
(cores, tipografia `Newsreader`/`Manrope`) do app original em `src/styles.css`,
e adiciona transições/animações (`fade-in`, `slide-up`, interceptors de erro
com toasts) que o app estático não tinha.

```
src/app/
├── core/          services (Auth, Course, ClassSession, Room, Plan, Syllabus),
│                  interceptors (JWT, erros), guards (auth, papel)
├── shared/        componentes reutilizáveis (notificações)
└── features/
    ├── auth/login/      tela de login (substitui login.html)
    ├── shell/           header + abas + seletor de curso (substitui index.html)
    ├── rooms/           ocupação de salas
    ├── schedule/        grade horária semanal
    ├── subjects/        índice de disciplinas + ementa
    ├── plan/            "Meu plano" (aluno)
    ├── dashboard/        "Painel" com KPIs (professor)
    └── admin/           CRUD de turmas e salas (professor)
```

## Pré-requisitos

- Java 21, Maven 3.9+ (para rodar o backend fora de Docker)
- Node 22+ (para rodar o frontend fora de Docker)
- Docker + Docker Compose (para o ambiente completo)

## Rodando com Docker Compose (recomendado para homologação)

```bash
cp .env.example .env     # ajuste JWT_SECRET e senhas antes de usar fora do seu laptop
docker compose up --build
```

- Frontend: http://localhost:4201
- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html
- MySQL: localhost:3306 (`bussola` / senha do `.env`)
- MongoDB: localhost:27017

O backend roda as migrations do Flyway automaticamente na primeira
inicialização (schema + usuários/turmas de exemplo). O Mongo roda
`infra/mongo-init/init.js` automaticamente também.

## Abrindo no IntelliJ

1. `File > Open...` e selecione a pasta `backend/` (o `pom.xml` identifica o
   projeto Maven automaticamente).
2. Rode `mysql` e `mongo` via `docker compose up mysql mongo` (ou instale-os
   localmente) antes de iniciar a aplicação pela IDE.
3. Configure as variáveis de ambiente da run configuration (`MYSQL_URL`,
   `MYSQL_USER`, `MYSQL_PASSWORD`, `MONGO_URI`, `JWT_SECRET`) ou rode com o
   profile `dev` (`application-dev.yml`), que já tem defaults de
   desenvolvimento local em `application.yml`.
4. Rode `BussolaBackendApplication`.
5. Para o frontend: abra `frontend/` em uma IDE com suporte a Angular (ou o
   próprio IntelliJ com o plugin oficial), rode `npm install && npm start`.

## Contas de teste (seed)

| Usuário | Senha | Papel | Curso |
|---|---|---|---|
| jefferson | jef2026 | professor | — |
| jobson | job2026 | professor | — |
| geiza | gei2026 | professor | — |
| ana | aluno1 | aluno | bsi |
| pedro | aluno2 | aluno | eng |

## Importando o dataset completo

O `V2__seed_data.sql` traz uma **amostra representativa** (não as 56 turmas
de BSI, 66 de Engenharia e centenas de IBIO do app original) para validar o
fluxo ponta-a-ponta rapidamente. Para a carga completa, duas opções:

1. **Recomendada:** escreva um script único (`backend/src/main/resources/db/migration/V3__legacy_data.sql`)
   gerado a partir de `horario-data.js` / `eng-data.js` / `ibio-data.js` —
   cada registro JS vira um `INSERT INTO class_session` + `class_session_slot`.
   Como o formato (campos `curr2008`/`curr2023`/`sessions`/`sala`/`vagas`) é
   idêntico ao schema relacional criado aqui, essa conversão é mecânica.
2. Alternativa mais rápida para prototipagem: um endpoint
   `POST /api/admin/import` (não incluído nesta entrega) que recebe o JSON
   exportado dos arrays legados e persiste via os casos de uso já existentes
   (`CreateClassSessionUseCase`), reaproveitando toda a validação de domínio.

## Testes

- `backend/src/test/.../domain/classsession/ClassSessionTest.java` — testes de
  domínio puro (sem Spring), cobrindo as invariantes do agregado `ClassSession`
  (exige ao menos um currículo, ao menos um horário, vagas não-negativas,
  detecção de choque de horário).
- `backend/src/test/.../application/auth/AuthenticateUserUseCaseTest.java` —
  caso de uso de autenticação com Mockito.

Rode com `mvn test` (dentro do `backend/`).

> **Nota sobre este ambiente de geração:** o sandbox onde este projeto foi
> montado tem acesso de rede bloqueado para o Maven Central (política de
> egress do ambiente), então não foi possível rodar `mvn compile`/`mvn test`
> aqui. A camada de domínio (que não depende de nenhuma biblioteca externa)
> foi compilada e verificada diretamente com `javac` neste ambiente. O
> restante do código (application/infrastructure, que dependem do Spring
> Framework) foi escrito e revisado com cuidado, mas **rode `mvn clean verify`
> assim que abrir no IntelliJ** para pegar qualquer detalhe de symbol/import
> que só um compilador com acesso às dependências reais consegue confirmar.

## Próximos passos sugeridos antes de produção

1. Importar o dataset completo (ver seção acima).
2. Trocar `JWT_SECRET` e as senhas do `.env` por valores gerados
   aleatoriamente e geridos por um cofre de segredos (Vault, AWS Secrets
   Manager, etc.) — nunca commitados.
3. Adicionar testes de integração com Testcontainers (MySQL + Mongo reais)
   para os adapters de persistência.
4. Avaliar rate limiting no `/api/auth/login` contra força bruta.
5. Pipeline de CI (build + testes + scan de dependências) antes do deploy.
