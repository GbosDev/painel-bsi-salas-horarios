-- Dados de bootstrap para o ambiente de homologação.
-- Usuários e catálogo de cursos replicam 1:1 o legado (auth.js / courses-data.js).
-- As turmas abaixo são uma amostra representativa de cada curso para validar
-- o fluxo ponta-a-ponta; a carga completa (56 turmas BSI, 66 ENG, centenas em
-- IBIO) deve ser importada via o script em infra/mysql-init/import-legacy-data
-- (ver README "Importando o dataset completo").

INSERT INTO course_group (id, sigla, nome, descricao) VALUES
  ('ibio', 'IBIO', 'Instituto de Biociências', 'Cursos de graduação do Instituto de Biociências agrupados no seletor de curso.');

INSERT INTO course (id, grupo_id, sigla, painel, nome, unidade, status, descricao) VALUES
  ('bsi', NULL, 'BSI', 'BSI', 'Bacharelado em Sistemas de Informação', 'CCET', 'COMPLETO',
    'Painel completo de salas, horários e disciplinas do BSI.'),
  ('eng', NULL, 'ENG', 'ENG', 'Engenharia de Produção', 'CCET', 'COMPLETO',
    'Painel completo de salas, horários e disciplinas de Engenharia de Produção.'),
  ('mat', NULL, 'MAT', 'MAT', 'Matemática', 'CCET', 'ESCOPO',
    'Painel em fase de escopo — dados de exemplo enquanto o levantamento curricular é concluído.'),
  ('ibio-bcb', 'ibio', 'BCB', 'IBIO', 'Bacharelado em Ciências Biológicas', 'IBIO', 'COMPLETO', NULL),
  ('ibio-lcb', 'ibio', 'LCB', 'IBIO', 'Licenciatura em Ciências Biológicas', 'IBIO', 'COMPLETO', NULL),
  ('ibio-bca', 'ibio', 'BCA', 'IBIO', 'Bacharelado em Ciências Ambientais', 'IBIO', 'COMPLETO', NULL),
  ('ibio-lcn', 'ibio', 'LCN', 'IBIO', 'Licenciatura em Ciências Naturais', 'IBIO', 'COMPLETO', NULL);

-- Usuários (senhas com hash BCrypt — nenhuma credencial em texto puro, ao
-- contrário do legado UserRepo.users).
INSERT INTO app_user (id, username, password_hash, nome, role, matricula, course_id) VALUES
  ('u-jefferson', 'jefferson', '$2b$10$H3t7fCHNYoyMzBM.ieLuCOQWn5TR7zMT8b9tJ06PpSx4rvHnHEb/q', 'Prof. Jefferson', 'PROFESSOR', NULL, NULL),
  ('u-jobson',    'jobson',    '$2b$10$/f1GcuZuawt2B.5CB5MeveRSO4kNpzQOr4KstGQiOJzkurDmDpFeO', 'Prof. Jobson',    'PROFESSOR', NULL, NULL),
  ('u-geiza',     'geiza',     '$2b$10$tVz1xXM.d3wdC2pGxVdQbuTIHAxnO4kByZ3j48ja0Ptsy8s/UTbjW', 'Profa. Geiza',    'PROFESSOR', NULL, NULL),
  ('u-ana',       'ana',       '$2b$10$.Bm7cyY0t1kt3HvtrsKm5uaONQDh/Zs.Y7Sx0Z.jJcnH2gSBZmvKe', 'Ana Souza',       'ALUNO',     '2026100101', 'bsi'),
  ('u-pedro',     'pedro',     '$2b$10$EiwBsjNV6PMq80NYnwn1cO6umMdws9JqVHnYQBFtGpTjH4TO.j.pK', 'Pedro Lima',      'ALUNO',     '2026100102', 'eng');

-- Salas
INSERT INTO room (id, course_id, nome) VALUES
  ('r-bsi-301', 'bsi', 'Sala 301'),
  ('r-bsi-302', 'bsi', 'Sala 302'),
  ('r-bsi-lab1', 'bsi', 'Lab. 101'),
  ('r-eng-201n', 'eng', 'Sala 201N'),
  ('r-eng-lab302', 'eng', 'Lab. 302');

-- Turmas — amostra representativa (BSI)
INSERT INTO class_session (id, course_id, curr2008_nome, curr2008_sigla, curr2008_codigo, curr2008_periodo, curr2008_ppgi,
                            curr2023_nome, curr2023_sigla, curr2023_codigo, curr2023_periodo, curr2023_ppgi,
                            professor, sala, vagas, section, programa, ementa_url)
VALUES
  (1001, 'bsi', 'Algoritmos e Programação I', 'AP1', 'BSI001', '1', 0,
                 'Algoritmos e Programação I', 'AP1', 'BSI001', '1', 0,
                 'Prof. Jefferson', 'Sala 301', 40, 'REGULAR', NULL, NULL),
  (1002, 'bsi', 'Banco de Dados I', 'BD1', 'BSI014', '4', 0,
                 'Banco de Dados I', 'BD1', 'BSI014', '4', 0,
                 'Prof. Jobson', 'Lab. 101', 35, 'REGULAR', NULL, NULL),
  (1003, 'bsi', NULL, NULL, NULL, NULL, 0,
                 'Engenharia de Software II', 'ES2', 'BSI027', '6', 0,
                 'Profa. Geiza', 'Sala 302', 30, 'REGULAR', NULL, NULL);

INSERT INTO class_session_slot (class_session_id, day_num, day_label, day_short, hour) VALUES
  (1001, 1, 'Segunda-feira', 'Seg', 8),
  (1001, 3, 'Quarta-feira', 'Qua', 8),
  (1002, 2, 'Terça-feira', 'Ter', 18),
  (1002, 4, 'Quinta-feira', 'Qui', 18),
  (1003, 5, 'Sexta-feira', 'Sex', 20);

-- Turmas — amostra representativa (Engenharia de Produção)
INSERT INTO class_session (id, course_id, professor, sala, vagas, section, programa, ementa_url,
                            curr2023_nome, curr2023_sigla, curr2023_codigo, curr2023_periodo)
VALUES
  (2001, 'eng', 'Prof. Jobson', 'Sala 201N', 45, 'REGULAR', '', NULL,
                 'Pesquisa Operacional I', 'PO1', 'ENG033', '5'),
  (2002, 'eng', 'Profa. Geiza', 'Lab. 302', 25, 'POS', '', NULL,
                 'Gestão da Qualidade', 'GQ', 'ENG041', 'O');

INSERT INTO class_session_slot (class_session_id, day_num, day_label, day_short, hour) VALUES
  (2001, 1, 'Segunda-feira', 'Seg', 16),
  (2001, 3, 'Quarta-feira', 'Qua', 16),
  (2002, 6, 'Sábado', 'Sáb', 8);
