# Painel CCET X IBIO — versão estática (pré-migração)

HTML/CSS/JS puro, sem build. Abra com um servidor estático (ex.: `python3 -m http.server 8000` e acesse http://localhost:8000/login.html) ou com a extensão Live Server da IDE.

## Contas de demonstração (js/auth.js)
Professores: jefferson/jef2026, jobson/job2026, geiza/gei2026 — Alunos: ana/aluno1, pedro/aluno2.

## Estrutura
- login.html / index.html
- css/style.css
- js/: auth, store, app (núcleo + helpers `window.__b_helpers`), planner (Meu plano), exceptional-edit (Ajuste excepcional), csv-import, history
<<<<<<< HEAD
- data/: dados dos cursos (BSI, ENG, IBIO, MAT)
=======
- data/: dados dos cursos (horario-data = BSI, eng-data = Engenharia de Produção, mat-data = Licenciatura em Matemática, ibio-data = IBIO)
>>>>>>> master

## Persistência (localStorage)
bussola_session, bussola_store_<curso>, bussola_overrides_<curso>, bussola_audit, bussola_plan_<usuario>_<curso>

## Notas
- Duração da sessão: BSI usa blocos de 2h; ENG/IBIO/MAT usam 1h por entrada. Conflitos usam sobreposição de intervalos.
- Responsivo: ≤700px mostra a grade um dia por vez e tabelas viram cards.
- Testado em Chromium (desktop e emulação iPhone/Android). Safari/iOS real não foi testado.
<<<<<<< HEAD
=======

## Atualização de horários (ENG e MAT)
Ver `RELATORIO-HORARIOS.md` (o que foi inserido, o que ficou pendente por conflito e as alternativas).
>>>>>>> master
