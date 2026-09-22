# Bússola — Painel de Salas e Horários

Painel interativo de acompanhamento de ocupação de salas, grade horária e
disciplinas — construído originalmente a partir de `Horário_BSI_2026_2.CSV`
(curso de Sistemas de Informação) e agora preparado para receber outros
cursos. HTML/CSS/JS puros — sem build, sem backend real (login e edições
vivem no `localStorage` do navegador).

## Estrutura do projeto

```
painel-bsi/
├── login.html            → tela de entrada (usuário/senha de demonstração)
├── index.html              → o painel em si: Salas, Grade, Disciplinas e Painel (métricas)
├── css/
│   └── style.css          → todos os tokens de design e componentes visuais
├── js/
│   ├── auth.js             → login/sessão de demonstração (localStorage)
│   └── app.js              → toda a lógica do painel: filtros, gráficos, edição, busca
└── data/
    ├── horario-data.js     → grade real do BSI, já estruturada em JSON (window.BSI_DATA)
    ├── ementas.js           → ementário oficial (UNIRIO) por código de disciplina
    └── courses-data.js      → catálogo de cursos + datasets de exemplo (IBIO, Engenharia)
```

## Como rodar

Abra `login.html` no navegador (duplo clique) — não precisa de servidor nem
de instalação. Depois de entrar, o login já leva direto para `index.html`,
que também funciona por `file://`, já que os dados ficam em `<script>`s comuns.

Se preferir um servidor local:

```bash
docker compose up
# depois abra http://localhost:4201/login.html
```

## Login e papéis de acesso

Não é autenticação real — é só uma simulação para testar as duas visões do
painel. As credenciais ficam em texto puro em `js/auth.js`, comentado
deixando isso bem claro.

| Usuário | Senha | Papel      | O que vê a mais |
|---------|-------|------------|------------------|
| `aluno` | `123` | Estudante  | Salas, Grade horária, Disciplinas |
| `adm`   | `456` | Professor  | tudo isso **+** aba **Painel** (métricas) **+** pode editar horário/sala/professor de qualquer turma |

A sessão fica salva em `localStorage.bussola_session`. `index.html` chama
`BussolaAuth.requireSession()` no `<head>`, antes de renderizar qualquer
coisa — sem sessão, redireciona direto pro login.

### Edição de horário/sala/professor (só professor)

No drawer de detalhes de qualquer turma (abre ao clicar numa disciplina na
Grade, no Índice ou numa sala ocupada), o professor vê um botão **"✎ Editar
horário / sala / professor"**. As alterações:

- atualizam a tela na hora (grade, salas, disciplinas, KPIs, gráficos);
- ficam salvas em `localStorage` por curso (`bussola_overrides_<curso>`),
  sobrepostas aos dados originais no próximo carregamento;
- **não mexem** nos arquivos `data/*.js` — é só uma camada por cima, local a
  cada navegador. Para "resetar", limpe o localStorage do site.

## Múltiplos cursos (BSI completo + versões de escopo)

O seletor em grade ao lado da logo, no cabeçalho do painel, troca de curso
via `index.html?curso=bsi|ibio|eng`. Isso é lido em `js/app.js` e decide de
qual chave de `window.BUSSOLA_DATASETS` (definido em `data/courses-data.js`)
os dados vêm:

- **BSI** (`bsi`) — grade completa, vinda de `data/horario-data.js`.
- **IBIO** (`ibio`) — Ciências Biológicas / da Natureza / Ambientais — **versão
  de escopo**: só algumas disciplinas de exemplo, pra provar que o mesmo
  painel funciona com outro curso plugado.
- **Engenharia de Produção** (`eng`) — mesma ideia, versão de escopo.

Um banner amarelo aparece automaticamente no topo do painel quando o curso
ativo é de escopo. Para integrar a grade real de um desses cursos depois,
gere um array no mesmo formato de `horario-data.js` e troque a entrada
correspondente em `window.BUSSOLA_DATASETS` dentro de `courses-data.js`.

## Onde mexer

- **Cores e tipografia** — tudo centralizado em `:root` no topo de `css/style.css`.
- **Credenciais de teste** — `js/auth.js`, objeto `USERS`.
- **Cursos e dados de exemplo** — `data/courses-data.js`.
- **Dados da grade do BSI** — `data/horario-data.js` (regenere a partir do CSV
  se a planilha for atualizada: delimitador `;`, colunas de cada grade,
  professor, dois horários, sala, vagas).
- **Textos fixos (hero, rodapé)** — direto em `index.html` / `login.html`.

## Sobre a correspondência de grades (2008 × 2023)

Cada linha do CSV original do BSI descreve a mesma aula (mesmo horário, sala
e professor) sob o nome/sigla da grade antiga **e** da grade atual, quando
ambas existem. O alternador "Grade 2023 / Grade 2008" no cabeçalho troca qual
delas é exibida como principal em todo o painel — a outra grade continua
acessível pelo tooltip da sigla e pelo painel de detalhes (drawer). Uma
disciplina que só existe numa das grades aparece corretamente nos dois modos
graças a um fallback automático em `subjectLabel()` (`js/app.js`).
