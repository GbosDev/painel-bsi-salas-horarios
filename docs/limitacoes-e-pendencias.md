# Limitações e pendências (reais)

## Não verificado por execução
1. **A camada Spring nunca foi compilada nem executada** (Maven Central inacessível no ambiente de construção). Pode haver erros de compilação, de mapeamento JPA ou de configuração. Primeiro passo: `cd backend && ./mvnw verify`.
2. `ddl-auto=validate`: tipos `SMALLINT` e `CHAR(64)` receberam `columnDefinition`, mas só a subida real confirma.
3. `ArquiteturaTest` e `MysqlIntegracaoTest` (Testcontainers) nunca rodaram. O wrapper Maven (`mvnw`) não teve o download testado.
4. **Docker**: Dockerfiles, nginx, healthchecks e `docker-compose.yml` nunca foram construídos ou executados (sem daemon).
5. **MySQL 8.4 não foi usado**: o SQL foi validado em MariaDB 10.11.
6. Os testes E2E e as capturas usaram **API simulada**, não o backend real. Não houve teste ponta a ponta frontend ↔ Spring.
7. Lighthouse não foi executado. As fontes do Google não carregam no ambiente de captura (fontes de reserva funcionam).

## Decisões e desvios conscientes
* **Sessão + CSRF em vez de JWT** (o `CLAUDE.md` sugere stateless): ver [ADR 0003](adr/0003-sessao-em-vez-de-jwt.md).
* **Paginação**: não há paginação genérica; o painel carrega o curso inteiro (≈120 turmas no máximo) e a auditoria tem `limite`.
* **Redesign moderado**: tokens, estados, responsividade e acessibilidade; a identidade visual original foi mantida, não houve re-tematização completa. React Bits não foi adotado.
* Usuários/senhas do `auth.js` não foram migrados (demonstração).
* `localStorage` do navegador não pode ser lido pelo servidor: há procedimento de exportação/importação em [`migracao-de-dados.md`](migracao-de-dados.md).
* Spotless/Checkstyle não foram configurados no backend.

## Problemas nos dados de origem (não corrigidos)
* **235 conflitos de sala** nos dados do IBIO/ENG, importados como estão e visíveis no sistema.
* ENG: 51 turmas sem horário, 60 sem sala, 53 sem professor; várias vieram de "disciplinas sem horário fixo".

## Primeiros passos
1. `./mvnw verify` e corrigir o que aparecer.
2. `docker compose up --build` e importar os dados.
3. Percorrer: login, troca de senha, cadastro de usuário, prévia/aplicação de CSV, ajuste excepcional, plano com choque.
4. HTTPS e `COOKIE_SEGURO=true` em produção.
