-- =====================================================================
-- Painel CCET x IBIO - esquema inicial (MySQL 8 / MariaDB 10.6+)
-- Nomes de dominio em portugues, snake_case. Sem dados de usuarios
-- nem credenciais: contas sao criadas pela aplicacao (ver README).
-- =====================================================================

CREATE TABLE centro (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  sigla      VARCHAR(20)  NOT NULL,
  nome       VARCHAR(150) NOT NULL,
  descricao  VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_centro_sigla (sigla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE curso (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  centro_id   BIGINT       NOT NULL,
  codigo      VARCHAR(30)  NOT NULL,
  sigla       VARCHAR(20)  NOT NULL,
  nome        VARCHAR(150) NOT NULL,
  situacao    VARCHAR(20)  NOT NULL DEFAULT 'completo',
  descricao   VARCHAR(255) NULL,
  tema        VARCHAR(20)  NOT NULL DEFAULT 'padrao',
  alterna_matrizes BOOLEAN NOT NULL DEFAULT FALSE,
  duracao_aula_horas SMALLINT NOT NULL DEFAULT 1,
  ordem       INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_curso_codigo (codigo),
  CONSTRAINT fk_curso_centro FOREIGN KEY (centro_id) REFERENCES centro (id),
  CONSTRAINT ck_curso_situacao CHECK (situacao IN ('completo', 'escopo')),
  CONSTRAINT ck_curso_tema CHECK (tema IN ('padrao', 'eng', 'mat', 'ibio')),
  CONSTRAINT ck_curso_duracao CHECK (duracao_aula_horas BETWEEN 1 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE periodo_letivo (
  id      BIGINT      NOT NULL AUTO_INCREMENT,
  codigo  VARCHAR(10) NOT NULL,
  ativo   BOOLEAN     NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  UNIQUE KEY uk_periodo_letivo_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE docente (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  nome             VARCHAR(200) NOT NULL,
  nome_normalizado VARCHAR(200) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_docente_nome_normalizado (nome_normalizado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sala (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  centro_id  BIGINT      NOT NULL,
  nome       VARCHAR(60) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sala_centro_nome (centro_id, nome),
  CONSTRAINT fk_sala_centro FOREIGN KEY (centro_id) REFERENCES centro (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catalogo de salas visivel em cada curso (aba "Salas").
CREATE TABLE curso_sala (
  curso_id BIGINT NOT NULL,
  sala_id  BIGINT NOT NULL,
  ordem    INT    NOT NULL DEFAULT 0,
  PRIMARY KEY (curso_id, sala_id),
  CONSTRAINT fk_curso_sala_curso FOREIGN KEY (curso_id) REFERENCES curso (id) ON DELETE CASCADE,
  CONSTRAINT fk_curso_sala_sala  FOREIGN KEY (sala_id)  REFERENCES sala (id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Disciplina de uma matriz curricular (2008 = antiga, 2023 = atual).
CREATE TABLE disciplina (
  id                  BIGINT       NOT NULL AUTO_INCREMENT,
  curso_id            BIGINT       NOT NULL,
  matriz              SMALLINT     NOT NULL,
  sigla               VARCHAR(60)  NOT NULL,
  codigo              VARCHAR(30)  NULL,
  nome                VARCHAR(250) NOT NULL,
  periodo_curricular  VARCHAR(5)   NOT NULL DEFAULT '1',
  pos_graduacao       BOOLEAN      NOT NULL DEFAULT FALSE,
  chave_natural       CHAR(64)     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_disciplina_chave_natural (chave_natural),
  KEY ix_disciplina_curso_matriz_sigla (curso_id, matriz, sigla),
  CONSTRAINT fk_disciplina_curso FOREIGN KEY (curso_id) REFERENCES curso (id),
  CONSTRAINT ck_disciplina_matriz CHECK (matriz IN (2008, 2023))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ementa (
  id      BIGINT       NOT NULL AUTO_INCREMENT,
  codigo  VARCHAR(30)  NOT NULL,
  nome    VARCHAR(250) NOT NULL,
  texto   TEXT         NOT NULL,
  fonte   VARCHAR(200) NOT NULL DEFAULT 'Portal do Ementario - UNIRIO',
  PRIMARY KEY (id),
  UNIQUE KEY uk_ementa_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE turma (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  curso_id             BIGINT       NOT NULL,
  periodo_letivo_id    BIGINT       NOT NULL,
  disciplina_2023_id   BIGINT       NULL,
  disciplina_2008_id   BIGINT       NULL,
  docente_id           BIGINT       NULL,
  sala_id              BIGINT       NULL,
  vagas                INT          NOT NULL DEFAULT 0,
  secao                VARCHAR(10)  NOT NULL DEFAULT 'regular',
  ementa_url           VARCHAR(500) NULL,
  origem               VARCHAR(20)  NOT NULL DEFAULT 'csv',
  id_legado            INT          NULL,
  versao               INT          NOT NULL DEFAULT 0,
  criado_em            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  atualizado_em        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  excluida_em          DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_turma_curso_id_legado (curso_id, id_legado),
  KEY ix_turma_curso_periodo (curso_id, periodo_letivo_id),
  KEY ix_turma_sala (sala_id),
  CONSTRAINT fk_turma_curso     FOREIGN KEY (curso_id)           REFERENCES curso (id),
  CONSTRAINT fk_turma_periodo   FOREIGN KEY (periodo_letivo_id)  REFERENCES periodo_letivo (id),
  CONSTRAINT fk_turma_disc_2023 FOREIGN KEY (disciplina_2023_id) REFERENCES disciplina (id),
  CONSTRAINT fk_turma_disc_2008 FOREIGN KEY (disciplina_2008_id) REFERENCES disciplina (id),
  CONSTRAINT fk_turma_docente   FOREIGN KEY (docente_id)         REFERENCES docente (id),
  CONSTRAINT fk_turma_sala      FOREIGN KEY (sala_id)            REFERENCES sala (id),
  CONSTRAINT ck_turma_secao CHECK (secao IN ('regular', 'pos')),
  CONSTRAINT ck_turma_origem CHECK (origem IN ('legado', 'csv', 'excepcional')),
  CONSTRAINT ck_turma_vagas CHECK (vagas >= 0),
  CONSTRAINT ck_turma_alguma_disciplina CHECK (disciplina_2023_id IS NOT NULL OR disciplina_2008_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE turma_horario (
  id           BIGINT   NOT NULL AUTO_INCREMENT,
  turma_id     BIGINT   NOT NULL,
  dia_semana   TINYINT  NOT NULL,
  hora_inicio  TIME     NOT NULL,
  hora_fim     TIME     NOT NULL,
  PRIMARY KEY (id),
  KEY ix_turma_horario_turma (turma_id),
  KEY ix_turma_horario_dia (dia_semana, hora_inicio),
  CONSTRAINT fk_turma_horario_turma FOREIGN KEY (turma_id) REFERENCES turma (id) ON DELETE CASCADE,
  CONSTRAINT ck_turma_horario_dia CHECK (dia_semana BETWEEN 1 AND 6),
  CONSTRAINT ck_turma_horario_intervalo CHECK (hora_fim > hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario (
  id                BIGINT       NOT NULL AUTO_INCREMENT,
  login             VARCHAR(60)  NOT NULL,
  nome              VARCHAR(150) NOT NULL,
  senha_hash        VARCHAR(100) NOT NULL,
  perfil            VARCHAR(20)  NOT NULL,
  matricula         VARCHAR(30)  NULL,
  curso_padrao_id   BIGINT       NULL,
  ativo             BOOLEAN      NOT NULL DEFAULT TRUE,
  tentativas_falhas INT          NOT NULL DEFAULT 0,
  bloqueado_ate     DATETIME(3)  NULL,
  criado_em         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuario_login (login),
  CONSTRAINT fk_usuario_curso FOREIGN KEY (curso_padrao_id) REFERENCES curso (id),
  CONSTRAINT ck_usuario_perfil CHECK (perfil IN ('ALUNO', 'PROFESSOR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plano_aluno (
  id                 BIGINT      NOT NULL AUTO_INCREMENT,
  usuario_id         BIGINT      NOT NULL,
  curso_id           BIGINT      NOT NULL,
  periodo_letivo_id  BIGINT      NOT NULL,
  atualizado_em      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_plano_usuario_curso_periodo (usuario_id, curso_id, periodo_letivo_id),
  CONSTRAINT fk_plano_usuario FOREIGN KEY (usuario_id)        REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_plano_curso   FOREIGN KEY (curso_id)          REFERENCES curso (id),
  CONSTRAINT fk_plano_periodo FOREIGN KEY (periodo_letivo_id) REFERENCES periodo_letivo (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plano_aluno_turma (
  plano_id BIGINT NOT NULL,
  turma_id BIGINT NOT NULL,
  PRIMARY KEY (plano_id, turma_id),
  CONSTRAINT fk_plano_turma_plano FOREIGN KEY (plano_id) REFERENCES plano_aluno (id) ON DELETE CASCADE,
  CONSTRAINT fk_plano_turma_turma FOREIGN KEY (turma_id) REFERENCES turma (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE importacao_lote (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  tipo             VARCHAR(10)  NOT NULL,
  curso_id         BIGINT       NULL,
  usuario_id       BIGINT       NULL,
  nome_arquivo     VARCHAR(255) NULL,
  hash_sha256      CHAR(64)     NULL,
  situacao         VARCHAR(12)  NOT NULL,
  observacao       VARCHAR(500) NULL,
  total_linhas     INT          NOT NULL DEFAULT 0,
  total_ok         INT          NOT NULL DEFAULT 0,
  total_aviso      INT          NOT NULL DEFAULT 0,
  total_erro       INT          NOT NULL DEFAULT 0,
  total_criadas    INT          NOT NULL DEFAULT 0,
  total_atualizadas INT         NOT NULL DEFAULT 0,
  relatorio_json   LONGTEXT     NULL,
  criado_em        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  aplicado_em      DATETIME(3)  NULL,
  PRIMARY KEY (id),
  KEY ix_importacao_lote_curso (curso_id),
  CONSTRAINT fk_importacao_lote_curso   FOREIGN KEY (curso_id)   REFERENCES curso (id),
  CONSTRAINT fk_importacao_lote_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT ck_importacao_lote_tipo CHECK (tipo IN ('CSV', 'LEGADO')),
  CONSTRAINT ck_importacao_lote_situacao CHECK (situacao IN ('PREVIA', 'APLICADO', 'DESCARTADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE importacao_linha (
  id            BIGINT      NOT NULL AUTO_INCREMENT,
  lote_id       BIGINT      NOT NULL,
  numero_linha  INT         NOT NULL,
  situacao      VARCHAR(10) NOT NULL,
  mensagem      VARCHAR(500) NULL,
  dados_json    LONGTEXT    NULL,
  PRIMARY KEY (id),
  KEY ix_importacao_linha_lote (lote_id),
  CONSTRAINT fk_importacao_linha_lote FOREIGN KEY (lote_id) REFERENCES importacao_lote (id) ON DELETE CASCADE,
  CONSTRAINT ck_importacao_linha_situacao CHECK (situacao IN ('ok', 'aviso', 'erro'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria_alteracao (
  id                  BIGINT       NOT NULL AUTO_INCREMENT,
  ocorrida_em         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  usuario_id          BIGINT       NULL,
  autor_nome          VARCHAR(150) NOT NULL,
  autor_perfil        VARCHAR(20)  NOT NULL,
  curso_id            BIGINT       NOT NULL,
  tipo                VARCHAR(30)  NOT NULL,
  turma_id            BIGINT       NULL,
  turma_sigla         VARCHAR(60)  NULL,
  turma_nome          VARCHAR(250) NULL,
  motivo              VARCHAR(500) NOT NULL,
  antes_json          LONGTEXT     NULL,
  depois_json         LONGTEXT     NULL,
  importacao_lote_id  BIGINT       NULL,
  PRIMARY KEY (id),
  KEY ix_auditoria_ocorrida_em (ocorrida_em),
  KEY ix_auditoria_curso_tipo (curso_id, tipo),
  CONSTRAINT fk_auditoria_curso   FOREIGN KEY (curso_id)   REFERENCES curso (id),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT ck_auditoria_tipo CHECK (tipo IN ('csv_criada', 'csv_atualizada', 'exceptional_edit', 'exceptional_create',
                                                'exceptional_delete', 'sala_add', 'sala_remove'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
