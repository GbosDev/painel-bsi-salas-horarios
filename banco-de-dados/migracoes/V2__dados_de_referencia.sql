-- Dados de referencia (catalogo de centros/cursos e periodo letivo vigente).
-- Nao contem usuarios, senhas nem turmas: turmas entram pela ferramenta de
-- importacao de dados legados ou pelo CSV.

INSERT INTO centro (sigla, nome, descricao) VALUES
  ('CCET', 'Centro de Ciências Exatas e Tecnologia', NULL),
  ('IBIO', 'Instituto de Biociências', 'Escolha o curso do Instituto de Biociências');

INSERT INTO curso (centro_id, codigo, sigla, nome, situacao, descricao, tema, alterna_matrizes, duracao_aula_horas, ordem)
SELECT c.id, v.codigo, v.sigla, v.nome, v.situacao, v.descricao, v.tema, v.alterna, v.duracao, v.ordem
FROM centro c
JOIN (
  SELECT 'CCET' AS centro, 'bsi' AS codigo, 'BSI' AS sigla, 'Sistemas de Informação' AS nome, 'completo' AS situacao,
         'Grade completa do semestre 2026/2.' AS descricao, 'padrao' AS tema, TRUE AS alterna, 2 AS duracao, 1 AS ordem
  UNION ALL SELECT 'CCET', 'eng', 'ENG', 'Engenharia de Produção', 'completo', 'Grade do semestre 2026/2.', 'eng', FALSE, 1, 2
  UNION ALL SELECT 'CCET', 'mat', 'MAT', 'Licenciatura em Matemática', 'escopo',
         'Versão de escopo — disciplinas de exemplo, grade oficial ainda não integrada.', 'mat', FALSE, 1, 3
  UNION ALL SELECT 'IBIO', 'ibio-bcb', 'CBIO·B', 'Ciências Biológicas — Bacharelado', 'completo', 'Grade do semestre 2026/2.', 'ibio', FALSE, 1, 4
  UNION ALL SELECT 'IBIO', 'ibio-lcb', 'CBIO·L', 'Ciências Biológicas — Licenciatura', 'completo', 'Grade do semestre 2026/2. Salas ainda não informadas.', 'ibio', FALSE, 1, 5
  UNION ALL SELECT 'IBIO', 'ibio-bca', 'CAMB', 'Ciências Ambientais — Bacharelado', 'completo', 'Grade do semestre 2026/2.', 'ibio', FALSE, 1, 6
  UNION ALL SELECT 'IBIO', 'ibio-lcn', 'CNAT', 'Ciências da Natureza — Licenciatura', 'completo', 'Grade do semestre 2026/2.', 'ibio', FALSE, 1, 7
) v ON v.centro = c.sigla;

INSERT INTO periodo_letivo (codigo, ativo) VALUES ('2026/2', TRUE);
