# Relatório de importação de dados legados (gravacao)

- Início: 2026-11-07T03:46:32.139Z
- Fim: 2026-11-07T03:46:32.882Z
- Origem: `banco-de-dados/dados-legados`
- Total lido: **492** turmas · criadas nesta execução: **492** · conferência: **OK**

## Por curso

| Curso | Lidas | Criadas | Já existiam | Horários criados | Salas no catálogo | Confere |
|---|---:|---:|---:|---:|---:|:--:|
| bsi | 56 | 56 | 0 | 102 | 9 | sim |
| eng | 121 | 121 | 0 | 239 | 12 | sim |
| mat | 39 | 39 | 0 | 136 | 8 | sim |
| ibio-bcb | 81 | 81 | 0 | 248 | 24 | sim |
| ibio-lcb | 85 | 85 | 0 | 306 | 24 | sim |
| ibio-bca | 50 | 50 | 0 | 176 | 17 | sim |
| ibio-lcn | 60 | 60 | 0 | 177 | 21 | sim |

## Qualidade da origem

| Curso | Turmas | Horários | Sem horário | Sem sala | Sem professor |
|---|---:|---:|---:|---:|---:|
| bsi | 56 | 102 | 2 | 7 | 0 |
| eng | 121 | 239 | 51 | 60 | 53 |
| mat | 39 | 136 | 0 | 0 | 0 |
| ibio-bcb | 81 | 248 | 0 | 8 | 3 |
| ibio-lcb | 85 | 306 | 2 | 23 | 0 |
| ibio-bca | 50 | 176 | 0 | 10 | 0 |
| ibio-lcn | 60 | 177 | 0 | 6 | 4 |

Conflitos de sala (mesma sala, mesmo centro, horários sobrepostos) na origem: **235** — importados como estão e apontados aqui para correção pela coordenação.

## Anomalias

- eng: sigla_repetida_com_dados_diferentes (2) — mantidas como disciplinas distintas (chave natural inclui código, nome e período)
- ibio-bcb: sigla_repetida_com_dados_diferentes (1) — mantidas como disciplinas distintas (chave natural inclui código, nome e período)
- ibio-lcb: sigla_repetida_com_dados_diferentes (3) — mantidas como disciplinas distintas (chave natural inclui código, nome e período)

## Ementas

Na origem: 97 · inseridas: 97 · já existiam: 0 · texto divergente (mantido o do banco): 0

## Não migrado (de propósito)

- `programa`: redundante com o curso (ibio-*); não migrado
- `day_label/day_short`: derivados de dia_semana; recalculados na leitura
- `localStorage (bussola_*)`: dados do navegador não são importados indiscriminadamente; ver docs/migracao-de-dados.md
- `usuários e senhas do auth.js`: credenciais de demonstração em texto puro; não migradas
> Segunda execução imediata (idempotência): 0 turmas criadas, 492 "já existiam", conferência OK.
