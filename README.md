# Bússola BSI — Painel de Salas e Horários

Painel interativo de acompanhamento de ocupação de salas, construído a partir de
`Horário_BSI_2026_2.CSV`. HTML/CSS/JS puros — sem build, sem dependências de
servidor (as únicas requisições externas são as fontes do Google Fonts).

## Estrutura do projeto

```
painel-bsi/
├── index.html          → estrutura da página e dos 4 painéis (Painel, Prédio, Grade, Disciplinas)
├── css/
│   └── style.css       → todos os tokens de design (cores, tipografia) e componentes visuais
├── js/
│   └── app.js          → toda a lógica: filtros, gráficos SVG, prédio 3D, busca, grade horária
└── data/
    └── horario-data.js → os dados da planilha, já estruturados em JSON (window.BSI_DATA)
```

## Como rodar

Basta abrir `index.html` direto no navegador (duplo clique). Não precisa de
servidor local nem de instalação — os dados ficam num `<script>` comum
(`data/horario-data.js`), então funciona até por `file://`.

Se preferir usar um servidor local (ex.: para testar em outro dispositivo na
mesma rede), qualquer um serve:

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

## Onde mexer

- **Cores e tipografia** — tudo centralizado em `:root` no topo de `css/style.css`
  (variáveis `--ink`, `--paper`, `--amber`, `--teal`, `--plum`, etc.).
- **Mapeamento de andares do prédio 3D** — no topo de `js/app.js`, procure por
  `var BUILDINGS = [...]`. Cada prédio tem uma lista de andares, e cada andar
  uma lista de salas. Foi estimado pela numeração das salas (Sala 2xx → 2º
  andar) porque a planilha não trazia a planta oficial — ajuste os arrays de
  `rooms` para bater com a planta real do seu campus.
- **Tamanho/proporção das lajes do prédio 3D** — constantes `FLOOR_W`,
  `FLOOR_D`, `FLOOR_H`, `FLOOR_GAP` logo abaixo de `BUILDINGS` em `app.js`.
- **Dados da grade horária** — `data/horario-data.js`. Cada objeto representa
  uma "aula" (mesmo horário/sala/professor), com `curr2008` e `curr2023`
  trazendo a disciplina de cada grade curricular (um dos dois pode ser `null`
  quando a disciplina só existe numa das grades). Se a planilha for atualizada,
  regenere este arquivo a partir do CSV (mesma lógica: delimitador `;`,
  colunas de cada grade, professor, dois horários, sala, vagas).
- **Textos fixos (hero, rodapé, nota sobre os andares)** — direto em
  `index.html`.

## Detalhes técnicos do modelo 3D

O prédio é CSS 3D "de verdade" (perspective + `transform-style: preserve-3d`),
não uma imagem nem uma lib externa — cada andar é uma laje com 4 faces
(frente, topo, lateral esquerda/direita) e as salas são marcadores clicáveis
dentro da face frontal. Arrastar o mouse/dedo gira o grupo inteiro em torno do
eixo vertical (`--yaw`); o ângulo de inclinação é fixo (`--pitch`). Isso deixa
o ajuste fino (ex.: mais andares, outro prédio) uma questão de editar o array
`BUILDINGS` e as constantes de tamanho — o resto se recalcula sozinho.

## Sobre a correspondência de grades (2008 × 2023)

Cada linha do CSV original descreve a mesma aula (mesmo horário, sala e
professor) sob o nome/sigla da grade antiga **e** da grade atual, quando
ambas existem. O alternador "Grade 2023 / Grade 2008 / Ambas" no cabeçalho
troca qual delas é exibida como principal em todo o painel — a outra grade
continua acessível pelo tooltip da sigla e pelo painel de detalhes (drawer).
