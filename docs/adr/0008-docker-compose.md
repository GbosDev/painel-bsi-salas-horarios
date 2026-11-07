# ADR 0008 — Docker Compose, imagens enxutas e não-root

- Status: aceita
- Data: 2026-11-07

## Contexto
Backend, banco e front devem subir com um comando, sem segredos no repositório.

## Decisão
`docker-compose.yml` com `db` (MySQL 8.4), `backend` e `frontend` (mais o perfil opcional `importador`), healthchecks, volume nomeado `dados-mysql`, senhas exigidas via `${VAR:?}`. Dockerfiles multi-stage; API em JRE com usuário não-root; front em `nginx-unprivileged` (porta 8080, UID 101). Banco publicado só em 127.0.0.1.

## Consequências
Subida: `docker compose up --build`. **Pendência:** não foi possível construir nem subir as imagens no ambiente de construção.
