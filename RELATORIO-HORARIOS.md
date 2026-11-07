# Relatório da atualização de horários (ENG e MAT) — 2026/2

## Matemática (`data/mat-data.js`, novo)
39 turmas lidas do PDF (substituem as 3 de exemplo; curso passou de "escopo" para "completo").
- Período = número entre colchetes; sala = linha do PDF (201N = labEMAT, 208N = LEMA); o PDF não traz código nem vagas (código vazio, vagas 0).
- "Estatística e Probabilidade [6]" dividida em duas turmas (ESTPROB-TER na 201N e ESTPROB-SEX na 202N): o painel guarda uma sala por turma.
- ICC (quinta) lida como bloco único 18h–22h (célula mesclada no PDF).

## Engenharia (`data/eng-data.js`) — 121 registros
- Campos vazios preenchidos (códigos e professores) e nomes corrigidos (Pesquisa Operacional I/II, Cálculo II).
- Nova turma: Mecânica dos Fluidos (TEP0048), sexta 15h, Sala 302N, sem professor.
- **Mecânica dos Sólidos (TEP0047)** inserida COM AVISO (campo `aviso`, exibido no detalhe da turma): mesmo professor e horário de Física IV (ter/qui 16–18); sem sala na planilha.
- **Probabilidade** dividida em PROB-TER (305N, terça 16–18) e PROB-SEX (301N, sexta 18–20).
- **Projeto de Instalações** dividido em PROINS-SEG (306N, segunda 20–22) e PROINS-QUA (304N, quarta 20–22).
- 51 registros sem horário fixo adicionados (sessions vazio): TCC I, TCC II, Estágio Supervisionado (sem período) e 48 optativas de catálogo (período O, sigla gerada a partir do nome, código da planilha).
- Ainda pendente (sem alteração): Geoprocessamento A e B com a mesma professora no mesmo horário (ter 21h–22h30); horários quebrados em meia hora arredondados para horas cheias; aulas de 1h suspeitas (EIF seg 9h, EEF ter 9h, Mecânica dos Fluidos sex 15h).

Observação: quem já tinha "Probabilidade" ou "Projeto de Instalações" salvos no Meu plano ficará só com a primeira metade e precisa marcar a outra turma.
