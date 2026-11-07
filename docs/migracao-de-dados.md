# Migração de dados

## O que foi migrado
Fonte: `window.*_DATA` do painel original, copiados para `banco-de-dados/dados-legados/` (somente leitura).

| Curso | Turmas | Horários | Salas |
|---|---:|---:|---:|
| BSI | 56 | 102 | 9 |
| Eng. de Produção | 121 | 239 | 12 |
| Lic. Matemática | 39 | 136 | 8 |
| IBIO — Bacharelado Ciências Biológicas | 81 | 248 | 24 |
| IBIO — Licenciatura Ciências Biológicas | 85 | 306 | 24 |
| IBIO — Biomedicina/BCA | 50 | 176 | 17 |
| IBIO — LCN | 60 | 177 | 21 |
| **Total** | **492** | | |

Mais 97 ementas. Relatório: [`relatorio-de-importacao-legada.md`](relatorio-de-importacao-legada.md).

## Como executar
```bash
cd banco-de-dados/ferramentas
npm ci
# defina BANCO_HOST, BANCO_PORTA, BANCO_NOME, BANCO_USUARIO, BANCO_SENHA
npm run simular     # lê, valida e grava dentro de uma transação que é DESFEITA
npm run importar    # grava de verdade
```
Docker: `docker compose --profile importacao run --rm importador`.

* **Idempotente:** chave natural (curso + id legado). Repetir não duplica (verificado: 2ª execução = 0 criadas).
* **Transacional** (tudo ou nada) e com **conferência** de contagem por curso.
* **Sem segredo no código:** conexão só por variáveis de ambiente.
* Relatório JSON e Markdown em `banco-de-dados/ferramentas/relatorios/` (fora do Git).
* Testes: `npm test` (13).

## Transformações
* Horários viram intervalos reais; horas consecutivas da mesma turma/dia são unidas.
* Docentes normalizados (sem acento, caixa, tratamento "Prof./Dra.").
* Salas viram catálogo por curso. Turmas com uma só sala por origem.
* Campo `aviso` preservado (V3). Turmas sem horário ficam como "sem horário fixo". Período desconhecido fica vazio.
* Siglas repetidas com dados diferentes permanecem como disciplinas separadas e são listadas em *Anomalias*.

## Não migrado
| Item | Motivo |
|---|---|
| Usuários/senhas do `auth.js` | Demonstração em texto puro. Contas reais: conta inicial `ADMIN_*` + tela de usuários |
| `day_label`, `day_short`, `programa` | Derivados/redundantes |
| `localStorage` do navegador | Ver abaixo |

## Edições locais no `localStorage` (procedimento manual)
O servidor não alcança o `localStorage` de ninguém. Se alguém fez edições locais no painel antigo que deseja manter:
1. No painel antigo, abra o console do navegador (F12) e rode `copy(JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k]) => k.startsWith('bussola_')))))`.
2. Cole o resultado em um arquivo `.json` e **revise** as turmas alteradas.
3. Reaplique no novo painel pelo **Ajuste excepcional** (com motivo, para constar no histórico) ou monte um CSV e use **Atualizar dados** (prévia → aplicar).
Não há conversão automática: dados locais não são auditáveis e poderiam sobrescrever o horário oficial.
