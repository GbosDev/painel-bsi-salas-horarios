# ADR 0001 — Monólito modular com hexagonal proporcional

- Status: aceita
- Data: 2026-11-07

## Contexto
O painel é pequeno (uma equipe, um deploy), mas tem regra de negócio relevante (conflitos de horário, plano, importação). O `CLAUDE.md` pede monólito modular e avaliação de hexagonal por módulo.

## Decisão
Um único deploy, pacotes por módulo de negócio (`oferta`, `catalogo`, `importacao`, `plano`, `acesso`, `auditoria`). Dentro de cada módulo: `dominio` (sem framework), `aplicacao` (casos de uso e portas, `@Transactional`), `infra` (adaptadores) e `api` (controllers/DTOs). Hexagonal é aplicado onde há regra a proteger; sem portas artificiais para CRUD trivial. Microsserviços foram descartados: custo operacional sem benefício para o volume.

## Consequências
Regras e casos de uso testáveis sem Spring nem banco (49 testes via fakes em memória). Um pouco de cerimônia a mais por módulo. Evolução futura para separar módulos continua possível, pois as dependências são explícitas.
