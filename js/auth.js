(function(){
"use strict";
/* ============================================================
   Bússola BSI — autenticação de demonstração
   ============================================================
   Isto NÃO é um sistema de login real. As credenciais abaixo são
   ilustrativas e ficam em texto puro só para fins de teste/aula —
   a "sessão" vive no localStorage do navegador, sem servidor, sem
   criptografia. Não reaproveite este padrão para dados reais.

   Usuários de teste:
     aluno / 123   → papel "aluno"      (vê o painel, não edita nada)
     adm   / 456   → papel "professor"  (vê métricas + pode editar
                                          horário, sala e professor)
   ============================================================ */

var USERS = {
  'aluno': { senha:'123', role:'aluno',     nome:'Estudante' },
  'adm':   { senha:'456', role:'professor', nome:'Professor(a)' }
};
var SESSION_KEY = 'bussola_session';

function getSession(){
  try{
    var raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function login(user, senha){
  var u = USERS[user];
  if (!u || u.senha !== senha) return false;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user:user, role:u.role, nome:u.nome, since:Date.now() }));
  return true;
}

function logout(){
  localStorage.removeItem(SESSION_KEY);
  location.href = 'login.html';
}

/* Chame no <head> de qualquer página protegida, antes do resto do
   conteúdo — se não houver sessão, redireciona pro login na hora. */
function requireSession(){
  var s = getSession();
  if (!s){ location.href = 'login.html'; return null; }
  return s;
}

window.BussolaAuth = { USERS:USERS, getSession:getSession, login:login, logout:logout, requireSession:requireSession };
})();
