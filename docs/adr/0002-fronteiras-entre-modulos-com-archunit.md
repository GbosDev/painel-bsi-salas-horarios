# ADR 0002 — Fronteiras entre módulos verificadas com ArchUnit

- Status: aceita
- Data: 2026-11-07

## Contexto
Módulos não devem acessar repositórios, entidades ou infra de outros módulos. Spring Modulith ou ArchUnit são as opções do `CLAUDE.md`.

## Decisão
Usar **ArchUnit** (`ArquiteturaTest`): domínio sem Spring/JPA; aplicação sem `api`/`infra`; sem ciclos entre módulos; sem dependência de `infra`/`api` de outro módulo. Dado compartilhado entre módulos passa por porta em `compartilhado` (ex.: `ReferenciasDeCurso`, implementada em `catalogo.infra`). ArchUnit foi escolhido por não exigir reorganizar os pacotes em torno do Modulith.

## Consequências
Violações quebram o build (`./mvnw verify`). **Pendência:** o teste foi escrito e as violações conhecidas corrigidas, mas ele não foi executado no ambiente de construção.
