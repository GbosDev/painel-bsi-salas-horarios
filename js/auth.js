(function(){
  "use strict";
  var SESSION_KEY='bussola_session';
  /* Repositório de usuários simulado. Para usar um banco real, troque apenas
     UserRepo.findByUsername por uma chamada à API mantendo o formato do retorno. */
  var UserRepo={
    users:[
      {user:'jefferson',senha:'jef2026',role:'professor',nome:'Prof. Jefferson',curso:'bsi'},
      {user:'jobson',senha:'job2026',role:'professor',nome:'Prof. Jobson',curso:'bsi'},
      {user:'geiza',senha:'gei2026',role:'professor',nome:'Profa. Geiza',curso:'bsi'},
      {user:'ana',senha:'aluno1',role:'aluno',nome:'Ana Souza',matricula:'2026100101',curso:'bsi'},
      {user:'pedro',senha:'aluno2',role:'aluno',nome:'Pedro Lima',matricula:'2026100202',curso:'eng'}
    ],
    findByUsername:function(u){ u=String(u||'').toLowerCase(); return this.users.filter(function(x){return x.user===u;})[0]||null; }
  };
  function getSession(){ try{ var r=localStorage.getItem(SESSION_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } }
  function login(user,senha){
    var u=UserRepo.findByUsername(user);
    if(!u||u.senha!==senha) return false;
    localStorage.setItem(SESSION_KEY,JSON.stringify({user:u.user,role:u.role,nome:u.nome,matricula:u.matricula||null,curso:u.curso,since:Date.now()}));
    return true;
  }
  function logout(){ localStorage.removeItem(SESSION_KEY); location.href='login.html'; }
  function requireSession(){ var s=getSession(); if(!s){ location.href='login.html'; return null; } return s; }
  window.BussolaAuth={UserRepo:UserRepo,getSession:getSession,login:login,logout:logout,requireSession:requireSession};
  })();
  