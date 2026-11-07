# Dicionário de dados

Gerado a partir do esquema real criado pelas migrações Flyway (`banco-de-dados/migracoes/V1`, `V2` e `V3`; `turma.aviso` veio na V3), aplicado em um banco de testes (MariaDB 10.11 — ver `limitacoes-e-pendencias.md`).

Convenções: nomes de tabelas e colunas em português, `snake_case`; chaves primárias `id` (BIGINT autoincremento); datas em UTC.

## `auditoria_alteracao`

Histórico: quem, o quê, por quê, antes/depois (JSON).

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `ocorrida_em` | datetime(3) | não | MUL | current_timestamp(3) |  |
| `usuario_id` | bigint(20) | sim | MUL | NULL | usuario.id |
| `autor_nome` | varchar(150) | não |  |  |  |
| `autor_perfil` | varchar(20) | não |  |  |  |
| `curso_id` | bigint(20) | não | MUL |  | curso.id |
| `tipo` | varchar(30) | não |  |  |  |
| `turma_id` | bigint(20) | sim |  | NULL |  |
| `turma_sigla` | varchar(60) | sim |  | NULL |  |
| `turma_nome` | varchar(250) | sim |  | NULL |  |
| `motivo` | varchar(500) | não |  |  |  |
| `antes_json` | longtext | sim |  | NULL |  |
| `depois_json` | longtext | sim |  | NULL |  |
| `importacao_lote_id` | bigint(20) | sim |  | NULL |  |

## `centro`

Unidade acadêmica (CCET, IBIO).

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `sigla` | varchar(20) | não | UNI |  |  |
| `nome` | varchar(150) | não |  |  |  |
| `descricao` | varchar(255) | sim |  | NULL |  |

## `curso`

Curso exibido no painel; define tema, duração da aula e se alterna entre matrizes 2008/2023.

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `centro_id` | bigint(20) | não | MUL |  | centro.id |
| `codigo` | varchar(30) | não | UNI |  |  |
| `sigla` | varchar(20) | não |  |  |  |
| `nome` | varchar(150) | não |  |  |  |
| `situacao` | varchar(20) | não |  | 'completo' |  |
| `descricao` | varchar(255) | sim |  | NULL |  |
| `tema` | varchar(20) | não |  | 'padrao' |  |
| `alterna_matrizes` | tinyint(1) | não |  | 0 |  |
| `duracao_aula_horas` | smallint(6) | não |  | 1 |  |
| `ordem` | int(11) | não |  | 0 |  |

## `curso_sala`

Catálogo de salas de cada curso, com ordem de exibição.

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `curso_id` | bigint(20) | não | PRI |  | curso.id |
| `sala_id` | bigint(20) | não | PRI |  | sala.id |
| `ordem` | int(11) | não |  | 0 |  |

## `disciplina`

Disciplina de uma matriz (2008 ou 2023) de um curso; chave natural única (hash).

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `curso_id` | bigint(20) | não | MUL |  | curso.id |
| `matriz` | smallint(6) | não |  |  |  |
| `sigla` | varchar(60) | não |  |  |  |
| `codigo` | varchar(30) | sim |  | NULL |  |
| `nome` | varchar(250) | não |  |  |  |
| `periodo_curricular` | varchar(5) | não |  | '1' |  |
| `pos_graduacao` | tinyint(1) | não |  | 0 |  |
| `chave_natural` | char(64) | não | UNI |  |  |

## `docente`

Professor(a); identidade por nome normalizado (sem tratamento, acento e caixa).

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `nome` | varchar(200) | não |  |  |  |
| `nome_normalizado` | varchar(200) | não | UNI |  |  |

## `ementa`

Ementa oficial por código de disciplina.

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `codigo` | varchar(30) | não | UNI |  |  |
| `nome` | varchar(250) | não |  |  |  |
| `texto` | text | não |  |  |  |
| `fonte` | varchar(200) | não |  | 'Portal do Ementario - UNIRIO' |  |

## `importacao_linha`

Linhas analisadas de um lote CSV (ok/aviso/erro).

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `lote_id` | bigint(20) | não | MUL |  | importacao_lote.id |
| `numero_linha` | int(11) | não |  |  |  |
| `situacao` | varchar(10) | não |  |  |  |
| `mensagem` | varchar(500) | sim |  | NULL |  |
| `dados_json` | longtext | sim |  | NULL |  |

## `importacao_lote`

Cada importação (CSV ou legado): situação, hash do arquivo e relatório em JSON.

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `tipo` | varchar(10) | não |  |  |  |
| `curso_id` | bigint(20) | sim | MUL | NULL | curso.id |
| `usuario_id` | bigint(20) | sim | MUL | NULL | usuario.id |
| `nome_arquivo` | varchar(255) | sim |  | NULL |  |
| `hash_sha256` | char(64) | sim |  | NULL |  |
| `situacao` | varchar(12) | não |  |  |  |
| `observacao` | varchar(500) | sim |  | NULL |  |
| `total_linhas` | int(11) | não |  | 0 |  |
| `total_ok` | int(11) | não |  | 0 |  |
| `total_aviso` | int(11) | não |  | 0 |  |
| `total_erro` | int(11) | não |  | 0 |  |
| `total_criadas` | int(11) | não |  | 0 |  |
| `total_atualizadas` | int(11) | não |  | 0 |  |
| `relatorio_json` | longtext | sim |  | NULL |  |
| `criado_em` | datetime(3) | não |  | current_timestamp(3) |  |
| `aplicado_em` | datetime(3) | sim |  | NULL |  |

## `periodo_letivo`

Semestre (ex.: 2026/2); as turmas pertencem a um período.

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `codigo` | varchar(10) | não | UNI |  |  |
| `ativo` | tinyint(1) | não |  | 0 |  |

## `plano_aluno`

Plano de aulas de um aluno em um curso.

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `usuario_id` | bigint(20) | não | MUL |  | usuario.id |
| `curso_id` | bigint(20) | não | MUL |  | curso.id |
| `periodo_letivo_id` | bigint(20) | não | MUL |  | periodo_letivo.id |
| `atualizado_em` | datetime(3) | não |  | current_timestamp(3) |  |

## `plano_aluno_turma`

Turmas escolhidas em um plano (sem choque de horário, validado no servidor).

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `plano_id` | bigint(20) | não | PRI |  | plano_aluno.id |
| `turma_id` | bigint(20) | não | PRI |  | turma.id |

## `sala`

Sala física do centro.

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `centro_id` | bigint(20) | não | MUL |  | centro.id |
| `nome` | varchar(60) | não |  |  |  |

## `turma`

Oferta de uma disciplina no período; exclusão lógica (excluida_em) e controle de versão otimista.

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `curso_id` | bigint(20) | não | MUL |  | curso.id |
| `periodo_letivo_id` | bigint(20) | não | MUL |  | periodo_letivo.id |
| `disciplina_2023_id` | bigint(20) | sim | MUL | NULL | disciplina.id |
| `disciplina_2008_id` | bigint(20) | sim | MUL | NULL | disciplina.id |
| `docente_id` | bigint(20) | sim | MUL | NULL | docente.id |
| `sala_id` | bigint(20) | sim | MUL | NULL | sala.id |
| `vagas` | int(11) | não |  | 0 |  |
| `secao` | varchar(10) | não |  | 'regular' |  |
| `ementa_url` | varchar(500) | sim |  | NULL |  |
| `aviso` | varchar(500) | sim |  | NULL |  |
| `origem` | varchar(20) | não |  | 'csv' |  |
| `id_legado` | int(11) | sim |  | NULL |  |
| `versao` | int(11) | não |  | 0 |  |
| `criado_em` | datetime(3) | não |  | current_timestamp(3) |  |
| `atualizado_em` | datetime(3) | não |  | current_timestamp(3) |  |
| `excluida_em` | datetime(3) | sim |  | NULL |  |

## `turma_horario`

Horários semanais da turma como intervalos reais (hora_inicio < hora_fim).

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `turma_id` | bigint(20) | não | MUL |  | turma.id |
| `dia_semana` | tinyint(4) | não | MUL |  |  |
| `hora_inicio` | time | não |  |  |  |
| `hora_fim` | time | não |  |  |  |

## `usuario`

Conta de acesso. Só guarda hash bcrypt; contador de falhas e bloqueio temporário.

| Coluna | Tipo | Nulo | Chave | Padrão | Referencia |
|---|---|:-:|:-:|---|---|
| `id` | bigint(20) | não | PRI | auto_increment |  |
| `login` | varchar(60) | não | UNI |  |  |
| `nome` | varchar(150) | não |  |  |  |
| `senha_hash` | varchar(100) | não |  |  |  |
| `perfil` | varchar(20) | não |  |  |  |
| `matricula` | varchar(30) | sim |  | NULL |  |
| `curso_padrao_id` | bigint(20) | sim | MUL | NULL | curso.id |
| `ativo` | tinyint(1) | não |  | 1 |  |
| `tentativas_falhas` | int(11) | não |  | 0 |  |
| `bloqueado_ate` | datetime(3) | sim |  | NULL |  |
| `criado_em` | datetime(3) | não |  | current_timestamp(3) |  |
