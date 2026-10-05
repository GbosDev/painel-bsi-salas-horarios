-- Bússola — esquema relacional do núcleo (MySQL)
-- Núcleo relacional: cursos, turmas, salas e usuários — dados com integridade
-- referencial forte, exatamente o caso de uso para o qual um RDBMS existe.
-- (Ementas, planos de estudo e o log de auditoria vivem no MongoDB — ver
-- infra/mongo-init — porque são schema-flexible / append-heavy / por-usuário.)

CREATE TABLE course_group (
    id        VARCHAR(40)  NOT NULL PRIMARY KEY,
    sigla     VARCHAR(40)  NOT NULL,
    nome      VARCHAR(150) NOT NULL,
    descricao VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE course (
    id        VARCHAR(40)  NOT NULL PRIMARY KEY,
    grupo_id  VARCHAR(40),
    sigla     VARCHAR(40)  NOT NULL,
    painel    VARCHAR(40),
    nome      VARCHAR(150) NOT NULL,
    unidade   VARCHAR(80),
    status    VARCHAR(20)  NOT NULL,
    descricao VARCHAR(1000),
    CONSTRAINT fk_course_group FOREIGN KEY (grupo_id) REFERENCES course_group(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE class_session (
    id              BIGINT       NOT NULL PRIMARY KEY,
    course_id       VARCHAR(40)  NOT NULL,
    curr2008_nome   VARCHAR(150),
    curr2008_sigla  VARCHAR(20),
    curr2008_codigo VARCHAR(30),
    curr2008_periodo VARCHAR(10),
    curr2008_ppgi   TINYINT(1) DEFAULT 0,
    curr2023_nome   VARCHAR(150),
    curr2023_sigla  VARCHAR(20),
    curr2023_codigo VARCHAR(30),
    curr2023_periodo VARCHAR(10),
    curr2023_ppgi   TINYINT(1) DEFAULT 0,
    professor       VARCHAR(150),
    sala            VARCHAR(80),
    vagas           INT NOT NULL DEFAULT 0,
    section         VARCHAR(10) NOT NULL DEFAULT 'REGULAR',
    programa        VARCHAR(150),
    ementa_url      VARCHAR(500),
    CONSTRAINT fk_class_session_course FOREIGN KEY (course_id) REFERENCES course(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_class_session_course ON class_session(course_id);
CREATE INDEX idx_class_session_sala ON class_session(sala);

CREATE TABLE class_session_slot (
    class_session_id BIGINT      NOT NULL,
    day_num           INT         NOT NULL,
    day_label         VARCHAR(20),
    day_short         VARCHAR(10),
    hour              INT         NOT NULL,
    CONSTRAINT fk_slot_class_session FOREIGN KEY (class_session_id) REFERENCES class_session(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_slot_day_hour ON class_session_slot(day_num, hour);

CREATE TABLE room (
    id        VARCHAR(40) NOT NULL PRIMARY KEY,
    course_id VARCHAR(40) NOT NULL,
    nome      VARCHAR(80) NOT NULL,
    CONSTRAINT fk_room_course FOREIGN KEY (course_id) REFERENCES course(id),
    CONSTRAINT uq_room_course_nome UNIQUE (course_id, nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE app_user (
    id            VARCHAR(40) NOT NULL PRIMARY KEY,
    username      VARCHAR(60) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    nome          VARCHAR(150),
    role          VARCHAR(20) NOT NULL,
    matricula     VARCHAR(30),
    course_id     VARCHAR(40),
    CONSTRAINT uq_app_user_username UNIQUE (username),
    CONSTRAINT fk_user_course FOREIGN KEY (course_id) REFERENCES course(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
