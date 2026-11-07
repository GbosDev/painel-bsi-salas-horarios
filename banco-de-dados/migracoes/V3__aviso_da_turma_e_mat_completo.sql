-- Aviso opcional exibido na gaveta da turma (ex.: conflito de sala conhecido, aguardando decisao da coordenacao).
ALTER TABLE turma ADD COLUMN aviso VARCHAR(500) NULL AFTER ementa_url;

-- Licenciatura em Matematica passou a ter a grade 2026/2 completa.
UPDATE curso
   SET situacao = 'completo',
       descricao = 'Grade do semestre 2026/2.'
 WHERE codigo = 'mat';
