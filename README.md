# Painel CCET × IBIO

Painel de salas, horários e disciplinas dos cursos do **CCET** (Sistemas de Informação, Engenharia de Produção, Licenciatura em Matemática) e do **IBIO** (Ciências Biológicas – bacharelado e licenciatura, Ciências Ambientais e Licenciatura em Ciências da Natureza) da UNIRIO.

> **Estado da verificação (nov/2026).** Backend compilado e testado (`./mvnw verify`: 78 testes, incluindo integração com MySQL 8.4 via Testcontainers), front testado (typecheck, lint, 60 testes Vitest), `docker compose up` de desenvolvimento e a pilha de **produção** (`docker-compose.prod.yml`, com HTTPS via Caddy) executados e validados localmente, inclusive com login real pelo navegador. O deploy em um servidor real ainda depende de você (seção 8).

## Sumário
1. [Apresentação](#1-apresentação)
2. [Requisitos](#2-requisitos)
3. [Estrutura de diretórios](#3-estrutura-de-diretórios)
4. [Ambientes: visão geral](#4-ambientes-visão-geral)
5. [Desenvolvimento local (sem Docker)](#5-desenvolvimento-local-sem-docker)
6. [Desenvolvimento com Docker](#6-desenvolvimento-com-docker)
7. [Produção: como funciona](#7-produção-como-funciona)
8. [Produção: passo a passo do deploy](#8-produção-passo-a-passo-do-deploy)
9. [Primeiro acesso e administrador](#9-primeiro-acesso-e-administrador)
10. [Banco de dados e migrações](#10-banco-de-dados-e-migrações)
11. [Importação de dados legados](#11-importação-de-dados-legados)
12. [Aba Painel: dashboard externo](#12-aba-painel-dashboard-externo)
13. [Testes e manutenção](#13-testes-e-manutenção)
14. [Backup e restauração](#14-backup-e-restauração)
15. [Solução de problemas](#15-solução-de-problemas)
16. [Documentação adicional](#16-documentação-adicional)

---

## 1. Apresentação

Este projeto é a **migração definitiva** do painel estático original (HTML/CSS/JS, dados em arquivos `.js`, "login" de demonstração no navegador) para uma aplicação completa:

* **Front-end** React + TypeScript (estrito) + Vite, com TanStack Query, React Hook Form + Zod, um cliente HTTP único e tipado, tokens de design em CSS, estados de carregamento/erro/vazio, layout responsivo e foco em acessibilidade (WCAG 2.2 AA como meta).
* **Back-end** Java 21 + Spring Boot, monólito modular com arquitetura hexagonal onde há regra de negócio, API REST em `/api/v1`, erros em Problem Details (RFC 9457) e OpenAPI (Swagger) só em desenvolvimento.
* **Banco** MySQL 8 com migrações Flyway.
* **Autenticação real** no servidor: BCrypt, sessão com cookie `HttpOnly`, CSRF, perfis `ALUNO` e `PROFESSOR`, bloqueio por tentativas. **Não há usuário nem senha padrão.**
* **Funcionalidades:** grade semanal, "acontecendo agora", mapa de salas, disciplinas e ementas, conflitos de horário e de sala, plano de aulas do estudante, ajuste excepcional com motivo e histórico, atualização de dados por CSV (prévia → aplicar, com exemplo montado a partir das turmas reais do curso escolhido), gestão de usuários, troca de senha e aba **Painel** com dashboard externo (Google Looker Studio).
* **Dados:** 492 turmas de 7 cursos importadas dos arquivos legados, 97 ementas.

O que mudou em relação ao original: [`docs/mudancas-em-relacao-ao-original.md`](docs/mudancas-em-relacao-ao-original.md).

## 2. Requisitos

| Item | Versão | Para quê | Link |
|---|---|---|---|
| Docker + Docker Compose v2 | recente | dev com Docker e produção | https://docs.docker.com/get-docker/ |
| Java (JDK) | **21** | backend local | https://adoptium.net/ |
| Maven | **3.9.11** via `./mvnw` (baixado sozinho) | build do backend | https://maven.apache.org/ |
| Spring Boot | **3.5.16** | backend | https://spring.io/projects/spring-boot |
| Flyway | **11.20.3** | migrações (reconhece MySQL 8.4) | https://www.red-gate.com/products/flyway/ |
| springdoc-openapi | **2.8.17** | Swagger (só dev) | https://springdoc.org/ |
| Testcontainers | **1.21.4** | teste de integração | https://testcontainers.com/ |
| Node.js | **22** | frontend e importador | https://nodejs.org/ |
| React / TypeScript / Vite | 18.3 / 5.6 / 8.x | frontend | https://react.dev/ |
| MySQL | **8.4** (Docker) · 8.0+ (local) | banco | https://dev.mysql.com/downloads/ |
| Caddy | **2.8** (Docker) | HTTPS automático em produção | https://caddyserver.com/ |

Versões exatas: `frontend/package-lock.json`, `banco-de-dados/ferramentas/package-lock.json` e `backend/pom.xml`.

## 3. Estrutura de diretórios

```
painel-ccet-ibio/
├── frontend/                   React + TypeScript + Vite
│   ├── src/app/                casca da aplicação e rotas
│   ├── src/features/<módulo>/  {components,hooks,api,types}
│   ├── src/shared/             cliente HTTP, config em tempo de execução, lib, ui, estilos
│   ├── src/testes/             Vitest + Testing Library
│   ├── e2e/                    Playwright
│   ├── nginx/default.conf.template   nginx do container (proxy /api, /config.json, CSP)
│   └── Dockerfile
├── backend/                    Spring Boot (br.unirio.painel.<módulo>.{api,aplicacao,dominio,infra})
│   ├── src/main/resources/application.yml        configuração base (dev)
│   ├── src/main/resources/application-prod.yml   perfil de produção
│   └── Dockerfile
├── banco-de-dados/
│   ├── migracoes/              V1..V4 (Flyway)
│   ├── dados-legados/          insumo (somente leitura) da importação
│   └── ferramentas/            importador Node + testes
├── infra/caddy/Caddyfile       proxy HTTPS de produção
├── docs/                       arquitetura, API, segurança, testes, ADRs…
├── scripts/                    backup, restauração (dev/prod), geração de senha, verificação geral
├── docker-compose.yml          DESENVOLVIMENTO com Docker
├── docker-compose.prod.yml     PRODUÇÃO (servidor)
├── .env.example                modelo do .env de desenvolvimento
└── .env.producao.example       modelo do .env.producao (fica só no servidor)
```

## 4. Ambientes: visão geral

O projeto tem **três formas de rodar**, cada uma com seu banco, suas portas e seu arquivo de configuração. Elas não se misturam e podem rodar ao mesmo tempo na sua máquina (exceto produção, que roda no servidor).

| | **Dev local** (seção 5) | **Dev Docker** (seção 6) | **Produção** (seções 7–8) |
|---|---|---|---|
| Onde roda | sua máquina, sem Docker | sua máquina, em containers | servidor na internet |
| Configuração | `.env` | `.env` | `.env.producao` (só no servidor) |
| Front-end | Vite em **http://localhost:5173** | nginx em **http://localhost:8083** | **https://SEU-DOMINIO** (Caddy → nginx) |
| API | **http://localhost:8080** | **http://127.0.0.1:8082** | interna (só via `https://SEU-DOMINIO/api`) |
| Swagger | **http://localhost:8081/actuator/swagger-ui** | desligado (`DOCS_API_DOCKER=true` liga em `:8082/swagger-ui/index.html`) | **sempre desligado** |
| Banco | MySQL da máquina, **127.0.0.1:3306** | container, **127.0.0.1:3307** | container, sem porta exposta |
| Perfil Spring | padrão | padrão | `prod` (cookie `Secure`, sem Swagger) |
| Comando | `.\mvnw.cmd spring-boot:run` + `npm run dev` | `docker compose up --build` | `docker compose -f docker-compose.prod.yml --env-file .env.producao up -d --build` |

**Regras de ouro para manter o controle:**

1. **Cada ambiente tem seu banco, seus usuários e suas senhas.** Criar um aluno no dev local não cria no Docker nem em produção. Use **senhas diferentes** em produção (`scripts/gerar-senha.sh`).
2. **Arquivo certo para cada ambiente:** `.env` = desenvolvimento (local e Docker); `.env.producao` = produção. Nenhum dos dois vai para o Git (`.gitignore`); só os `*.example` vão.
3. **Configuração muda por variável, não por código.** O mesmo código e as mesmas imagens Docker servem todos os ambientes; o que muda são as variáveis (portas, banco, `SPRING_PROFILES_ACTIVE=prod`, link do dashboard…).
4. **Variáveis do terminal vencem o `.env`.** Se algo se conecta ao lugar errado, confira `$env:BANCO_*` no PowerShell (`Get-ChildItem Env:BANCO_*`) e limpe com `Remove-Item Env:BANCO_*`.
5. **Código vai do dev para a produção sempre pelo mesmo caminho:** testar no dev → versionar (Git) → atualizar o servidor (seção 8, "Atualizar").

## 5. Desenvolvimento local (sem Docker)

Requisitos: JDK 21, Node 22 e um MySQL 8 instalado na máquina (porta 3306).

1. **Configuração:** `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`) e preencha as senhas (`scripts/gerar-senha.sh` gera senhas fortes). O backend local **lê o `.env` sozinho**, em UTF-8; não é preciso exportar variáveis.
2. **Banco** (uma vez, como root no MySQL Workbench ou `mysql`):
   ```sql
   CREATE DATABASE painel_ccet_ibio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'painel_app'@'localhost' IDENTIFIED BY '<BANCO_SENHA do .env>';
   GRANT ALL PRIVILEGES ON painel_ccet_ibio.* TO 'painel_app'@'localhost';
   ```
   Se o usuário já existir (erro 1396), use `ALTER USER 'painel_app'@'localhost' IDENTIFIED BY '...'`.
3. **Backend** (terminal 1):
   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run          # Linux/macOS: ./mvnw spring-boot:run
   ```
   Confira no log: `Database: jdbc:mysql://127.0.0.1:3306/...` e `Tomcat started on port 8080` e `8081`. Na primeira subida o Flyway cria as tabelas e a conta inicial (`ADMIN_LOGIN`).
4. **Frontend** (terminal 2):
   ```powershell
   cd frontend
   npm ci                              # só na primeira vez
   npm run dev                         # http://localhost:5173 (encaminha /api para a 8080)
   ```
5. **Dados** (terminal 3, com o backend no ar): seção 11, com `BANCO_PORTA=3306`.
6. **Swagger:** http://localhost:8081/actuator/swagger-ui. Ele roda numa porta separada da API; o "Try it out" chama a 8080 com o cookie de sessão. Faça primeiro `POST /api/v1/auth/login` no próprio Swagger.

## 6. Desenvolvimento com Docker

```bash
docker compose up --build                                   # db → backend → frontend
docker compose --profile importacao run --rm importador     # dados (primeira vez; pode repetir)
```

Acesse **http://localhost:8083**. A API fica em `127.0.0.1:8082` e o MySQL em `127.0.0.1:3307` (só na sua máquina).

Comandos úteis: `docker compose ps` · `docker compose logs -f backend` · `docker compose down` (mantém os dados) · `docker compose down -v` (**apaga** o banco de dev). Os dados ficam no volume `painel-ccet-ibio_dados-mysql`.

Para ver o Swagger no Docker: `DOCS_API_DOCKER=true` no `.env` e `docker compose up -d backend` → http://127.0.0.1:8082/swagger-ui/index.html (no Docker ele fica na própria porta da API).

## 7. Produção: como funciona

```
Internet ──HTTPS 443──▶ Caddy (certificado automático) ──▶ nginx (front + /config.json)
                                                             └── /api ──▶ API Spring (perfil prod) ──▶ MySQL
                         (só o Caddy tem porta aberta; API e banco ficam na rede interna do Docker)
```

O que o `docker-compose.prod.yml` garante, sem depender de configuração manual:

* **HTTPS obrigatório:** o Caddy obtém e renova o certificado Let's Encrypt e redireciona HTTP → HTTPS, com HSTS.
* **Perfil `prod` na API** (`application-prod.yml`): cookie de sessão `Secure`, Swagger desligado, cabeçalhos de proxy respeitados, actuator inacessível pela internet.
* **Banco e API sem portas publicadas**; reinício automático (`restart: always`); logs com rotação; projeto, rede e volumes próprios (`painel-ccet-ibio-prod_*`).
* **Mesma origem** para front e API (cookie de sessão + CSRF funcionam sem CORS).

### Onde hospedar de graça (e com segurança)

Os planos gratuitos mudam com frequência; **confira os limites atuais no site de cada serviço** antes de escolher.

| Opção | Como fica | Prós | Contras |
|---|---|---|---|
| **A. Uma VM gratuita (recomendado)** — Oracle Cloud *Always Free* (VM Ampere A1, Ubuntu) | a pilha inteira deste repositório (`docker-compose.prod.yml`) | arquitetura idêntica à testada; banco incluído; não "dorme"; você controla tudo | exige cartão para verificação da conta; você cuida de atualizações e backups |
| **B. PaaS + banco gerenciado** — Render (front e API como serviços Docker) + Aiven for MySQL (plano free) | front e API em serviços separados, banco gerenciado com TLS | sem servidor para administrar | serviços gratuitos "dormem" após inatividade (primeiro acesso lento); limites pequenos de banco; mais peças para configurar |

Para domínio gratuito, use um subdomínio do **DuckDNS** (https://www.duckdns.org): `seunome.duckdns.org` apontando para o IP do servidor. Se tiver domínio próprio, crie um registro `A` para o IP.

## 8. Produção: passo a passo do deploy

### Opção A — VM (Oracle Cloud Always Free ou qualquer VM Linux com Docker)

**1. Criar a VM**
1. Crie a conta em https://cloud.oracle.com (região mais próxima, ex.: São Paulo ou Vinhedo).
2. *Compute → Instances → Create instance*: imagem **Ubuntu 24.04**, shape **VM.Standard.A1.Flex** (2 OCPUs e 12 GB de RAM sobram), adicione sua **chave SSH pública**.
3. Anote o **IP público**.

**2. Abrir as portas 80 e 443**
1. Na OCI: *Networking → Virtual Cloud Networks → (sua VCN) → Security Lists → Default* → *Add Ingress Rules*: origem `0.0.0.0/0`, TCP, portas `80` e `443`.
2. Na VM (as imagens Ubuntu da OCI têm firewall próprio):
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
   **Não** abra 3306, 8080 ou 8081: em produção nada além de 80/443 precisa estar exposto.

**3. Domínio**: no DuckDNS (ou no seu provedor de DNS), aponte `SEU-DOMINIO` para o IP público. Teste com `ping SEU-DOMINIO`.

**4. Preparar o servidor**
```bash
ssh ubuntu@IP-DO-SERVIDOR
sudo apt update && sudo apt -y upgrade && sudo apt -y install git unattended-upgrades
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && exit        # saia e entre de novo no SSH
```

**5. Levar o código** (escolha um):
* **Git (recomendado):** crie um repositório **privado** no GitHub, envie o projeto e, no servidor, `git clone https://github.com/SEU-USUARIO/painel-ccet-ibio.git painel && cd painel` (use um *fine-grained token* só de leitura como senha).
* **Cópia direta:** da sua máquina, `scp -r painel-ccet-ibio-VERSAO-FINAL ubuntu@IP:~/painel` (não copie `.env`, `node_modules`, `target`).

**6. Configurar a produção** (no servidor, dentro de `~/painel`):
```bash
cp .env.producao.example .env.producao && chmod 600 .env.producao
scripts/gerar-senha.sh          # rode para BANCO_SENHA, BANCO_SENHA_ROOT e ADMIN_SENHA
nano .env.producao              # preencha DOMINIO, ACME_EMAIL, senhas, ADMIN_LOGIN, PAINEL_DASHBOARD_URL
```

**7. Subir e importar os dados**
```bash
alias prod='docker compose -f docker-compose.prod.yml --env-file .env.producao'   # atalho (ponha no ~/.bashrc)
prod up -d --build                              # 1ª vez demora alguns minutos (build)
prod ps                                         # todos "healthy"/"running"
prod --profile importacao run --rm importador   # 492 turmas, "conferência: OK"
```

**8. Primeiro acesso:** abra `https://SEU-DOMINIO`, entre com `ADMIN_LOGIN`, troque a senha (botão "senha"), **apague o valor de `ADMIN_SENHA` do `.env.producao`** e crie as contas reais em "usuários".

**9. Backups automáticos** (diários às 3h, mantendo 14 dias):
```bash
mkdir -p ~/backups
crontab -e
# adicione a linha:
0 3 * * * cd ~/painel && AMBIENTE=producao scripts/backup-banco.sh ~/backups && find ~/backups -name '*.sql.gz' -mtime +14 -delete
```
Copie os backups para fora do servidor de tempos em tempos (ex.: `scp ubuntu@IP:~/backups/*.gz .`) e teste a restauração (seção 14).

**Operação do dia a dia (no servidor):**

| Tarefa | Comando |
|---|---|
| Ver estado | `prod ps` |
| Logs da API / proxy | `prod logs -f backend` · `prod logs -f caddy` |
| **Atualizar** para uma nova versão | `git pull && prod up -d --build` (faça um backup antes) |
| Voltar uma versão | `git checkout <commit-ou-tag-anterior> && prod up -d --build` (migrações de banco não voltam: restaure o backup se a versão nova mudou o esquema) |
| Mudar o dashboard da aba Painel | edite `PAINEL_DASHBOARD_URL` no `.env.producao` e `prod up -d frontend` |
| Reiniciar tudo | `prod restart` |
| Parar (mantém dados) | `prod down` |

**Checklist de segurança:** acesso SSH só por chave; `unattended-upgrades` ativo; senhas de produção fortes e diferentes das de dev; `.env.producao` com `chmod 600`; apenas 80/443 abertas; `ADMIN_SENHA` apagada após o primeiro acesso; backups fora do servidor.

### Opção B — Render + Aiven (sem servidor próprio)

1. **Banco (Aiven for MySQL, plano free):** crie o serviço, crie o banco `painel_ccet_ibio` e baixe o **CA certificate**. Anote host, porta, usuário e senha.
2. **API (Render → New → Web Service → Docker):** repositório do projeto, *Root Directory* vazio, *Dockerfile Path* `backend/Dockerfile`. Variáveis: `SPRING_PROFILES_ACTIVE=prod`, `BANCO_HOST`, `BANCO_PORTA`, `BANCO_NOME`, `BANCO_USUARIO`, `BANCO_SENHA`, `BANCO_SSL_MODO=REQUIRED`, `BANCO_POOL_MAXIMO=5`, `ADMIN_LOGIN`, `ADMIN_SENHA`, `PORTA_API=8080`.
3. **Front (Render → Web Service → Docker):** *Root Directory* `frontend`. Variáveis: `API_ALVO=https://<sua-api>.onrender.com`, `API_HOST=$proxy_host` (o Render roteia pelo domínio da API) e `PAINEL_DASHBOARD_URL`. Na **API**, defina também `CORS_ORIGENS=https://<seu-front>.onrender.com` (o navegador envia a origem do front e a API precisa reconhecê-la). O usuário acessa só a URL do front (HTTPS do próprio Render); o nginx encaminha `/api` para a API.
4. **Dados:** da sua máquina, rode o importador (seção 11) apontando para o Aiven, com `BANCO_SSL_CA=<caminho do ca.pem>`.
5. Limitações: os serviços free "dormem" sem acesso (o primeiro acesso pode levar ~1 min) e o banco free tem pouco espaço. Para uso diário da coordenação, prefira a opção A.

## 9. Primeiro acesso e administrador

* Não existe credencial padrão. Na **primeira subida**, se o banco **não tiver nenhum usuário** e `ADMIN_LOGIN`/`ADMIN_SENHA` estiverem definidos, a API cria essa conta com perfil `PROFESSOR`. A senha precisa seguir a política (10+ caracteres, letras e números, ≠ login).
* Se o banco já tiver usuários, a conta **não** é criada (cada ambiente tem seu banco: seção 4).
* **Depois do primeiro login:** troque a senha (botão "senha"), **apague `ADMIN_SENHA`** do `.env`/`.env.producao` e crie as demais contas pelo botão "usuários" (resumo por perfil, busca, filtro e gerador de senha inicial).
* Perfis: `PROFESSOR` edita turmas, importa CSV, vê histórico e cria contas; `ALUNO` monta o próprio plano de aulas.
* **Estudantes são identificados pela matrícula:** matrícula e nome completo são obrigatórios, e **a matrícula é o login** (só números; espaços, pontos e traços digitados são removidos). Na tela aparecem como `20261000101 · Nome Completo`. O banco garante a regra (`login = matrícula` para estudantes, matrícula única).
* **Administração:** a conta inicial (`ADMIN_LOGIN`) é a **conta de administração** — a única que pode **ativar, desativar e apagar** contas (na tela de usuários e na API: os demais recebem 403). Ela não pode desativar nem apagar a si mesma.
  * **Desativar** encerra o acesso na hora (inclusive sessões já abertas) e mantém os dados; reativar devolve o acesso.
  * **Apagar** remove a conta de vez; o plano do estudante vai junto; o histórico de alterações continua com o nome do autor. Prefira desativar quando for temporário.
* Segurança em detalhe: [`docs/seguranca.md`](docs/seguranca.md).

## 10. Banco de dados e migrações

* Migrações em `banco-de-dados/migracoes/` (`V<n>__descricao.sql`), aplicadas pelo **Flyway** na subida da API, em qualquer ambiente.
* **Nunca edite uma migração já aplicada**: crie a próxima (`V4__...`). O Hibernate roda com `ddl-auto=validate` e nunca altera o esquema.
* Charset `utf8mb4`; datas em UTC; nomes em português `snake_case`.
* Dicionário de dados: [`docs/dicionario-de-dados.md`](docs/dicionario-de-dados.md). Console do banco Docker: `docker compose exec db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'` (produção: troque `docker compose` por `prod`).

## 11. Importação de dados legados

O importador (`banco-de-dados/ferramentas`) lê os `.js` do painel antigo (`banco-de-dados/dados-legados/`), normaliza e grava no MySQL. É **idempotente**, **transacional** e gera relatório. **Suba o backend antes**: é ele (Flyway) que cria as tabelas.

| Ambiente | Como importar |
|---|---|
| Dev Docker | `docker compose --profile importacao run --rm importador` |
| Produção | `prod --profile importacao run --rm importador` |
| Dev local (3306) ou banco externo | comandos abaixo |

**PowerShell (Windows):**

```powershell
cd banco-de-dados\ferramentas
npm ci                                   # só na primeira vez
$env:BANCO_HOST    = '127.0.0.1'
$env:BANCO_PORTA   = '3306'              # 3306 = MySQL local · 3307 = MySQL do Docker
$env:BANCO_NOME    = 'painel_ccet_ibio'
$env:BANCO_USUARIO = 'painel_app'
$env:BANCO_SENHA   = '<BANCO_SENHA do .env>'
# $env:BANCO_SSL_CA = 'C:\caminho\ca.pem'   # só para bancos na nuvem que exigem TLS
npm run simular     # ensaio: grava e desfaz; mostra o que seria feito
npm run importar    # grava de verdade; relatório em .\relatorios\
```

As variáveis `$env:` valem só para aquela janela. **Feche-a (ou rode `Remove-Item Env:BANCO_*`) antes de subir o backend nela**, senão ele usará essas variáveis no lugar do `.env`.

**Bash (Linux/macOS/Git Bash):**

```bash
cd banco-de-dados/ferramentas && npm ci
BANCO_HOST=127.0.0.1 BANCO_PORTA=3306 BANCO_NOME=painel_ccet_ibio BANCO_USUARIO=painel_app BANCO_SENHA='<senha>' npm run importar
```

* Resultado esperado na primeira execução: **492 turmas** e "conferência: OK"; numa segunda: 0 criadas, 492 "já existiam".
* Os dados de origem têm 235 conflitos de sala, importados como estão (lista no relatório em `relatorios/`).
* Atualizações futuras: aba **Atualizar dados** (CSV, detalhes abaixo) ou **Ajuste excepcional**.

### Atualizar dados por CSV — como funciona

1. Escolha **Centro** e **Curso de destino**. O exemplo da tela e o **Modelo (.csv)** usam turmas reais desse curso.
2. Para **corrigir turmas existentes**, baixe **Turmas atuais (.csv)**: cada linha vem com o **Id** da turma. Edite no Excel e reenvie.
3. Envie o arquivo. A **prévia** não grava nada e mostra, linha a linha, o que vai acontecer: **nova turma**, **atualiza** ou **sem mudança** — além de avisos (sala nova no catálogo, **conflito de sala**, horário ilegível, colunas com nome desconhecido) e erros (linha sem sigla/disciplina, horários que se cruzam, turma repetida no arquivo, sigla que existe em mais de uma turma do curso sem a coluna Id).
4. **Aplicar** grava exatamente o que a prévia mostrou, numa única transação, com histórico por turma. Se as turmas mudaram depois da prévia, nada é gravado e a tela pede para reenviar o arquivo.

Regras: a turma é localizada pela coluna **Id**, senão pela sigla da grade atual, senão pela da grade antiga. Células vazias não apagam dados; horários informados substituem todos os da turma (vários na mesma célula separados por `|`). Aceita `,`, `;` ou tabulação, UTF-8 ou Windows-1252 (Excel), a linha `sep=;` e ignora linhas vazias.

## 12. Aba Painel: dashboard externo

A aba **Painel** (perfil Professor) exibe um dashboard externo, por exemplo um relatório do **Google Looker Studio**.

1. No Looker Studio, abra o relatório → *Compartilhar* → dê acesso de leitura a quem vai ver (ou "qualquer pessoa com o link") → *Arquivo → Incorporar relatório* → marque **Ativar incorporação**.
2. Copie o link do relatório (`https://lookerstudio.google.com/reporting/<id>/page/<pagina>`); o painel converte para o formato de incorporação sozinho.
3. Defina `PAINEL_DASHBOARD_URL` com esse link:
   * dev local: no `.env`, e reinicie o `npm run dev`;
   * dev Docker: no `.env`, e `docker compose up -d frontend`;
   * produção: no `.env.producao`, e `prod up -d frontend`.

Não é preciso refazer o build: o front lê o link em tempo de execução (`/config.json`). São incorporados (iframe) apenas `lookerstudio.google.com`, `datastudio.google.com` e páginas **publicadas** do Google Sheets/Docs (`docs.google.com/.../pubhtml`); qualquer outro endereço `https` aparece como botão "Abrir dashboard em nova aba". Para permitir outro serviço, inclua o domínio em `HOSTS_INCORPORAVEIS` (`frontend/src/shared/lib/dashboardExterno.ts`) **e** no `frame-src` da CSP (`frontend/nginx/default.conf.template`).

## 13. Testes e manutenção

Verificação geral: `scripts/verificar-tudo.sh` (`--sem-backend` se não tiver Docker/Maven Central).

| O quê | Comando |
|---|---|
| Tipos · lint · formato | `cd frontend && npm run typecheck && npm run lint && npm run format` |
| Unitários e componentes (Vitest) | `npm test` |
| Build de produção do front | `npm run build` |
| E2E (Playwright, contra o Docker de dev em 8083) | `npx playwright install chromium` e `E2E_PROF_LOGIN=… E2E_PROF_SENHA=… E2E_ALUNO_LOGIN=… E2E_ALUNO_SENHA=… npm run test:e2e` |
| Importador | `cd banco-de-dados/ferramentas && npm test` |
| Backend (JUnit 5, ArchUnit, Testcontainers) | `cd backend && .\mvnw.cmd verify` — o teste de integração sobe um MySQL 8.4 e **exige Docker** |

Manutenção: `npm outdated`/`npm audit` e `.\mvnw.cmd versions:display-dependency-updates`; mudanças de esquema só por nova migração; ADRs em `docs/adr/` para decisões novas; commits no padrão Conventional Commits.

## 14. Backup e restauração

Os scripts funcionam nos dois ambientes Docker; `AMBIENTE` escolhe qual (padrão: desenvolvimento).

```bash
scripts/backup-banco.sh                                         # dev  → backups/painel-desenvolvimento-AAAAMMDD-HHMMSS.sql.gz
AMBIENTE=producao scripts/backup-banco.sh                       # prod → backups/painel-producao-….sql.gz
scripts/restaurar-banco.sh backups/painel-….sql.gz              # pede confirmação; SUBSTITUI o banco
AMBIENTE=producao scripts/restaurar-banco.sh backups/painel-….sql.gz
```

A senha do root é lida dentro do container, não da linha de comando. No Windows, rode-os pelo **Git Bash**. Para o MySQL local (3306), use o MySQL Workbench (*Server → Data Export/Import*). Guarde os backups fora da máquina e **teste a restauração** periodicamente.

## 15. Solução de problemas

| Sintoma | Causa provável e ação |
|---|---|
| `docker compose up` recusa: "defina BANCO_SENHA…" | `.env` (ou `.env.producao`) ausente ou com senhas vazias |
| Backend reinicia / `unhealthy` | `docker compose logs backend`. Comum: senha do banco diferente da usada na criação do volume (o MySQL só aplica as senhas do `.env` num volume novo) |
| Backend local conecta no banco errado / "Table … doesn't exist" | Variáveis `BANCO_*` definidas no terminal vencem o `.env`: `Remove-Item Env:BANCO_*` ou abra um terminal novo. Confira a linha `Database: jdbc:mysql://…` no log |
| Não consigo entrar | Banco sem usuários e `ADMIN_LOGIN`/`ADMIN_SENHA` vazios, ou o banco já tinha usuários (seção 9) |
| Conta bloqueada | 5 falhas seguidas bloqueiam por 15 minutos |
| 403 ao salvar algo | Cookie CSRF ausente: recarregue a página |
| Login dá 403 "Invalid CORS request" | O proxy está trocando o `Host`: no front use `API_HOST` padrão (`$http_host`); em PaaS, `API_HOST=$proxy_host` **e** `CORS_ORIGENS=<url do front>` na API |
| "Sua conta foi desativada ou removida" | A administração desativou/apagou a conta; fale com a coordenação |
| Produção: certificado HTTPS não sai | DNS ainda não aponta para o IP, ou portas 80/443 fechadas (Security List **e** iptables). Veja `prod logs caddy` |
| Produção: login não persiste | Acesse sempre por `https://SEU-DOMINIO` (o cookie é `Secure`) |
| Acentos quebrados ("CoordenaÃ§Ã£o") | Banco/cliente sem `utf8mb4`, ou dado gravado por versão antiga. Corrija o registro com `UPDATE` |
| Porta ocupada | Altere no `.env`: `PORTA_API`/`PORTA_DOCS` (local) ou `PORTA_WEB`/`PORTA_API_DOCKER`/`BANCO_PORTA_HOST` (Docker). O Vite não troca de porta sozinho (`strictPort`) |
| Aba Painel vazia | `PAINEL_DASHBOARD_URL` vazio, ou o relatório não tem "incorporação ativada"/compartilhamento (seção 12) |
| Swagger 404 | Dev local: `DOCS_API=true` → http://localhost:8081/actuator/swagger-ui · Docker: `DOCS_API_DOCKER=true` → http://127.0.0.1:8082/swagger-ui/index.html · produção: sempre desligado |
| Teste de integração não acha o Docker | Docker Desktop precisa estar aberto |

## 16. Documentação adicional

* [Arquitetura](docs/arquitetura.md) · [API](docs/api.md) · [Segurança](docs/seguranca.md)
* [Testes](docs/testes.md) · [Limitações e pendências](docs/limitacoes-e-pendencias.md)
* [Migração de dados](docs/migracao-de-dados.md) · [Dicionário de dados](docs/dicionario-de-dados.md) · [Relatório de importação](docs/relatorio-de-importacao-legada.md)
* [Decisões de arquitetura (ADRs)](docs/adr/)
