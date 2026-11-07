# ADR 0003 — Sessão no servidor + CSRF em vez de JWT

- Status: aceita
- Data: 2026-11-07

## Contexto
O `CLAUDE.md` sugere autenticação stateless (JWT/OAuth2) e pede CSRF avaliado conforme o tipo de autenticação. O painel é uma SPA servida pelo mesmo nginx que encaminha `/api`, ou seja, **mesma origem**, com poucos usuários e necessidade de encerrar sessões e bloquear contas.

## Decisão
Manter **sessão HTTP no servidor** com cookie `HttpOnly`, `SameSite=Lax` (`Secure` em produção), proteção **CSRF** por cookie `XSRF-TOKEN` + cabeçalho `X-XSRF-TOKEN`, BCrypt custo 12, bloqueio por tentativas e troca de id de sessão no login. Nenhum token fica acessível ao JavaScript (não há JWT em `localStorage`). CORS restrito às origens de `CORS_ORIGENS`.

## Consequências
Desvio consciente do `CLAUDE.md` (stateless). Vantagens: logout e revogação reais, menor superfície de XSS. Custo: estado de sessão no servidor (uma instância ou sessão compartilhada); para escalar horizontalmente seria preciso Spring Session (JDBC/Redis). Se surgir cliente móvel ou API de terceiros, reavaliar JWT/OAuth2 Resource Server.
