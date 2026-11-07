# API REST (`/api/v1`)

Base: `/api/v1`. JSON UTF-8. Todas as rotas exigem sessão, exceto `GET /auth/csrf` e `POST /auth/login`.
Requisições que alteram dados (`POST`, `PUT`, `DELETE`) precisam do cabeçalho `X-XSRF-TOKEN` com o valor do cookie `XSRF-TOKEN` (o front faz isso sozinho).

**Contrato OpenAPI (springdoc):** defina `DOCS_API=true` e abra `/swagger-ui.html` (JSON em `/v3/api-docs`). Fica desligado por padrão.

## Erros — Problem Details (RFC 9457)

`Content-Type: application/problem+json`:
`{ "type", "title", "status", "detail", "instance", "codigo": "...", "detalhes": ["..."] }`

| Status | Quando |
|---|---|
| 401 | sem sessão / credenciais inválidas (mesma mensagem para senha errada e usuário inexistente) |
| 403 | perfil sem permissão, ou CSRF ausente/inválido |
| 404 | curso, turma ou ementa inexistente |
| 409 | versão desatualizada de turma, plano com choque (`plano_com_conflito`), lote já aplicado |
| 422 | validação (`dados_invalidos`, `senha_fraca`, motivo curto, horário inválido…) |

## Endpoints

### Sessão
| Rota | Perfil | Descrição |
|---|---|---|
| `GET /auth/csrf` | público | emite o cookie CSRF |
| `POST /auth/login` `{login, senha}` | público | cria a sessão; 5 falhas bloqueiam a conta por 15 min |
| `POST /auth/logout` | autenticado | encerra a sessão |
| `GET /auth/eu` | autenticado | `{id, login, nome, perfil}` |
| `PUT /auth/senha` `{senhaAtual, novaSenha}` | autenticado | troca a própria senha |

### Leitura (qualquer perfil autenticado)
| Rota | Descrição |
|---|---|
| `GET /cursos` | cursos com centro, tema, situação, duração da aula |
| `GET /cursos/{codigo}/painel` | `{curso, periodoLetivo, salas[], turmas[]}`; a turma traz disciplinas (2008/2023), professor, sala, vagas, `aviso`, horários |
| `GET /turmas/{id}/ementa` | ementa da disciplina (404 se não houver) |

### Estudante (`ALUNO`)
| Rota | Descrição |
|---|---|
| `GET /cursos/{codigo}/plano` | plano salvo |
| `PUT /cursos/{codigo}/plano` `{turmaIds}` | grava; **409 `plano_com_conflito`** se houver choque |

### Professor (`PROFESSOR`)
| Rota | Descrição |
|---|---|
| `POST /cursos/{codigo}/turmas` | turma excepcional (exige `motivo` ≥ 8) |
| `PUT /turmas/{id}` | edita professor/sala/vagas/horários; exige `versao` e `motivo`; devolve `{turma, avisos[]}` |
| `POST /turmas/{id}/exclusao` `{motivo}` | exclusão lógica |
| `POST /cursos/{codigo}/salas` · `DELETE /cursos/{codigo}/salas/{salaId}` | catálogo de salas |
| `POST /cursos/{codigo}/importacoes` (multipart `arquivo`) | prévia do CSV |
| `POST /importacoes/{loteId}/aplicacao` `{observacao}` | aplica a prévia |
| `GET /auditoria?curso=&tipo=&periodo=&q=&limite=` | histórico |
| `GET /usuarios` · `POST /usuarios` | lista e cadastra contas |

Observação: a especificação pede paginação em listagens; o painel carrega cerca de 120 turmas por curso por vez e a auditoria é limitada por `limite`. Paginação completa está em [`limitacoes-e-pendencias.md`](limitacoes-e-pendencias.md).

## Formato do CSV
Colunas (sem acento, sem diferenciar maiúsculas; separador `,` ou `;`): `SiglaAntiga, DisciplinaAntiga, CodigoAntiga, PeriodoAntiga, SiglaAtual, DisciplinaAtual, CodigoAtual, PeriodoAtual, Professor, Horario1, Horario2, Sala, Vagas` (formato duplo) ou `Sigla, Disciplina, Professor, Horario1, …` (simples). Horários: `3ª 14h`, `terça 14:00`, `3 14h-16h`… (2ª = segunda). Máx. 1 MB e 2000 linhas. Valores iniciados por `=`, `+`, `-`, `@` viram texto.
