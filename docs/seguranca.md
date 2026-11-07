# Segurança

## Autenticação e sessão
* Senhas com **BCrypt (custo 12)**; nunca em texto puro nem em log.
* **Política:** 10+ caracteres, máx. 72 bytes (limite do BCrypt), letras e números, diferente do login.
* **Bloqueio:** 5 falhas seguidas bloqueiam a conta por 15 min; resposta idêntica para senha errada e usuário inexistente.
* Sessão no servidor; cookie `HttpOnly`, `SameSite=Lax`, `Secure` quando `COOKIE_SEGURO=true` (obrigatório em produção com HTTPS). Troca do id de sessão no login (anti-fixação).
* **CSRF:** cookie `XSRF-TOKEN` + cabeçalho `X-XSRF-TOKEN`.
* **Sem credenciais padrão:** nada no código, nas migrações, no Docker ou no `.env.example`. O primeiro administrador sai de `ADMIN_LOGIN`/`ADMIN_SENHA` e **só é criado se não existir nenhum usuário**. Se `ADMIN_*` estiver vazio, a API sobe sem usuários e registra um aviso. Depois do primeiro acesso, troque a senha e remova `ADMIN_SENHA` do `.env`.

## Autorização
Perfis `ALUNO` e `PROFESSOR` verificados no servidor (`@PreAuthorize`). Plano de aulas: somente `ALUNO`, somente o próprio. Qualquer rota fora de `/api/v1/**` e do health é negada (`denyAll`).

## Dados e entrada
* Segredos só em variáveis de ambiente; o Compose exige as senhas (`${VAR:?}`).
* SQL sempre parametrizado (JPA e JDBC).
* Upload de CSV: 1 MB, 2000 linhas, proteção contra injeção de fórmula.
* Ajuste excepcional exige motivo e gera auditoria na mesma transação.
* Concorrência otimista nas turmas.
* **CORS:** somente origens em `CORS_ORIGENS` (vazio = nenhuma), apenas em `/api/v1/**`, métodos e cabeçalhos explícitos.
* Contêineres da API e do front rodam sem root (nginx-unprivileged, UID 101).
* O front não guarda token nem senha em `localStorage`.

## Não coberto
Recuperação de senha por e-mail, 2FA, limite de taxa por IP, expiração de senha, varredura de imagens, teste de intrusão. Ver [`limitacoes-e-pendencias.md`](limitacoes-e-pendencias.md).
