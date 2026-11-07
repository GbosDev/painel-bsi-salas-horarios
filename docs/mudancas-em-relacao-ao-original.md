# Mudanças em relação ao painel original (estático)

| Tema | Original | Agora |
|---|---|---|
| Login | `auth.js` com usuários em texto puro e sessão em `localStorage` | Login real no servidor, BCrypt, cookie `HttpOnly`, bloqueio por tentativas, sem contas de demonstração |
| Dados | Arquivos `.js` embutidos | MySQL (Flyway) lido pela API; importador repetível |
| Edição | `localStorage` de cada navegador | Banco, com motivo obrigatório e histórico (antes/depois/autor) |
| Horários | "hora até hora + 2" fixo | Intervalos reais; duração por curso |
| Conflitos / "agora" | Hora de início | Sobreposição de intervalos |
| CSV | Lido no navegador; célula vazia apagava dado | Validado no servidor com prévia e "Aplicar"; célula vazia preserva |
| Meu plano | No navegador | Por usuário no servidor; choque recusado (409) |
| Avisos de turma | — | Campo `aviso` (ex.: choque de sala conhecido na origem) exibido na grade |
| Disciplinas sem horário fixo | — | Turmas sem sessão (ex.: Atividades de Extensão) listadas em seção própria |
| ENG e MAT | Dados parciais | ENG 121 turmas e MAT 39 turmas (horários 2026.2) |
| Interface | CSS único | Tokens CSS, 4 estados (carregando/erro/vazio/sucesso), tabelas em cartões e seletor de dia por chips no celular, foco visível, `prefers-reduced-motion` |
| Novos | — | Troca de senha, gestão de usuários, abas como rotas, code splitting |
