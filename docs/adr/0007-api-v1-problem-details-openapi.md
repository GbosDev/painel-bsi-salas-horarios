# ADR 0007 — API `/api/v1`, Problem Details e OpenAPI

- Status: aceita
- Data: 2026-11-07

## Contexto
O contrato precisa ser versionado, consistente em erros e documentado.

## Decisão
Todos os recursos em `/api/v1`; erros em Problem Details (RFC 9457) com extensões `codigo` e `detalhes`, tratados por `@RestControllerAdvice`; springdoc-openapi habilitado por `DOCS_API=true` (desligado por padrão em produção); DTOs como records com Bean Validation.

## Consequências
Front trata erros de um jeito só. Paginação genérica não foi implementada (volume baixo); registrada como pendência.
