# ADR 0006 — Importador isolado e idempotente dos dados legados

- Status: aceita
- Data: 2026-11-07

## Contexto
Os dados vinham de arquivos `.js` do painel estático e de `localStorage`. A migração deve ser repetível, auditável e sem apagar nada.

## Decisão
Ferramenta Node (`banco-de-dados/ferramentas`) que lê os `.js` num sandbox `vm`, normaliza (horários em intervalos, docentes, salas), grava numa transação (`--simular` desfaz), é idempotente por (curso, id legado), confere contagens e gera relatório JSON/Markdown. Usuários/senhas de demonstração não são migrados. O `localStorage` não pode ser lido pelo servidor: há procedimento manual de exportação (ver `migracao-de-dados.md`).

## Consequências
Rodar duas vezes é seguro (verificado). Dados com problemas na origem (conflitos de sala, turmas sem sala/professor) são importados como estão e relatados, não corrigidos.
