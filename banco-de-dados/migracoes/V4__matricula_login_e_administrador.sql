-- V4: estudantes identificados pela matricula; conta de administracao; exclusao de contas sem perder historico.

-- 1) Administracao: so a conta marcada pode ativar, desativar e apagar contas.
--    Marca a conta inicial (a primeira de PROFESSOR criada). A API tambem garante isso na partida (ADMIN_LOGIN).
ALTER TABLE usuario ADD COLUMN administrador TINYINT(1) NOT NULL DEFAULT 0 AFTER perfil;

UPDATE usuario u
  JOIN (SELECT MIN(id) AS id FROM usuario WHERE perfil = 'PROFESSOR') primeiro ON primeiro.id = u.id
   SET u.administrador = 1;

-- 2) Estudantes: a matricula e obrigatoria e passa a ser o login.
--    Estudante antigo sem matricula recebe o login atual como matricula (a coordenacao pode recriar a conta depois).
UPDATE usuario SET matricula = login
 WHERE perfil = 'ALUNO' AND (matricula IS NULL OR TRIM(matricula) = '');
UPDATE usuario SET matricula = TRIM(matricula) WHERE matricula IS NOT NULL;
UPDATE usuario SET login = matricula WHERE perfil = 'ALUNO';

ALTER TABLE usuario
  ADD UNIQUE KEY uk_usuario_matricula (matricula),
  ADD CONSTRAINT ck_usuario_aluno_matricula CHECK (perfil <> 'ALUNO' OR matricula IS NOT NULL),
  ADD CONSTRAINT ck_usuario_aluno_login CHECK (perfil <> 'ALUNO' OR login = matricula),
  ADD CONSTRAINT ck_usuario_admin_professor CHECK (administrador = 0 OR perfil = 'PROFESSOR');

-- 3) Apagar uma conta preserva o historico: autor_nome/autor_perfil ficam gravados; so a referencia vira NULL.
--    (O plano do estudante ja e apagado junto: fk_plano_usuario ON DELETE CASCADE.)
ALTER TABLE auditoria_alteracao DROP FOREIGN KEY fk_auditoria_usuario;
ALTER TABLE auditoria_alteracao
  ADD CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL;

ALTER TABLE importacao_lote DROP FOREIGN KEY fk_importacao_lote_usuario;
ALTER TABLE importacao_lote
  ADD CONSTRAINT fk_importacao_lote_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL;
