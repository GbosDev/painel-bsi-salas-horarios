(function(){
  "use strict";
  var B=window.__BUSSOLA__, H=window.__b_helpers, el=H.el, root=document.getElementById('view-plano');
  if(!root||B.IS_PROFESSOR||!B.SESSION) return;
  var KEY='bussola_plan_'+B.SESSION.user+'_'+B.CURSO, RECS=B.RECORDS, q='';
  function get(){ try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch(e){ return []; } }
  var saved=get(), sel=saved.slice();
  var COLORS=['#3D8577','#7C5A72','#B97A22','#B65C4A','#445374','#2A5F55','#5C4155'];
  function nm(r){ return r.curr2023||r.curr2008||{}; }
  function byId(id){ return RECS.filter(function(r){return r.id===id;})[0]; }
  function chosen(list){ return list.map(byId).filter(Boolean); }

  /* ============================================================
     VALIDAÇÃO DE CONFLITOS DE HORÁRIO
     Este app não tem backend/servidor — tudo roda no navegador e o plano
     fica em localStorage. Por isso, esta função é o único ponto por onde
     o plano é gravado (o botão "Salvar plano" é a única chamada a
     localStorage.setItem do arquivo); nenhuma gravação passa por fora
     dela, então validar aqui tem o mesmo efeito de uma validação no
     backend: nenhum conflito chega a ser persistido.
     ============================================================ */
  function findConflicts(list){
    var bySlot = {};
    chosen(list).forEach(function(r){
      r.sessions.forEach(function(s){
        var k = s.day_num+'-'+s.hour;
        (bySlot[k] = bySlot[k] || []).push(r);
      });
    });
    var out = [];
    Object.keys(bySlot).forEach(function(k){
      var recs = bySlot[k];
      if (recs.length > 1){
        var parts = k.split('-');
        out.push({ day:Number(parts[0]), hour:Number(parts[1]), recs:recs });
      }
    });
    return out;
  }
  function conflictCellKeys(conflictList){
    var m={}; conflictList.forEach(function(c){ m[c.day+'-'+c.hour]=1; }); return m;
  }
  function buildErrorBanner(conflictList){
    var box = el('div', {class:'plan-error', role:'alert'});
    box.appendChild(el('div', {class:'plan-error-title'}, ['Não foi possível salvar seu plano porque existem conflitos de horários entre as turmas selecionadas.']));
    box.appendChild(el('div', {class:'plan-error-sub'}, ['Revise os dias e horários das disciplinas indicadas e ajuste as informações antes de tentar novamente.']));
    var list = el('div', {class:'plan-error-list'});
    conflictList.forEach(function(c){
      var names = c.recs.map(function(r){ var n=nm(r); return (n.sigla||'—')+' — '+(n.nome||''); }).join('  ×  ');
      list.appendChild(el('div', {class:'plan-error-item'}, [el('b',{},[H.DAY_FULL[c.day]+' · '+H.fmtHour(c.hour)]), ': '+names]));
    });
    box.appendChild(list);
    return box;
  }

  function draw(){
    var conflictList = findConflicts(sel), cf = conflictCellKeys(conflictList);
    var dirty=JSON.stringify(sel)!==JSON.stringify(saved);
    root.innerHTML='';
    root.appendChild(el('div',{class:'section-head'},[el('div',{},[el('h2',{},['Meu plano de aulas']),el('div',{class:'desc'},['Escolha as turmas em que você está inscrito. O painel monta a semana, mostra as salas e avisa sobre choques de horário.'])])]));

    var summary = el('div', {class:'csv-summary'});
    summary.appendChild(el('div',{},[el('div',{class:'n'},[String(chosen(sel).length)]), el('div',{class:'lbl'},['turma(s) selecionada(s)'])]));
    summary.appendChild(el('div',{},[el('div',{class:'n'+(conflictList.length?' danger':'')},[String(conflictList.length)]), el('div',{class:'lbl'},['choque(s) de horário'])]));
    root.appendChild(summary);

    if (conflictList.length) root.appendChild(buildErrorBanner(conflictList));

    var cat=el('div',{class:'pl-cat'}), search=el('input',{type:'text',placeholder:'Filtrar por sigla, disciplina ou professor',value:q});
    search.addEventListener('input',function(){ q=search.value; list(); });
    var ul=el('div',{class:'pl-list'});
    function list(){ ul.innerHTML=''; var t=q.toLowerCase();
      RECS.filter(function(r){ var n=nm(r); return !t||(n.sigla+' '+n.nome+' '+(r.professor||'')).toLowerCase().indexOf(t)>=0; }).forEach(function(r){
        var n=nm(r), on=sel.indexOf(r.id)>=0;
        var b=el('button',{type:'button',class:'pl-item'+(on?' on':'')},[el('b',{},[n.sigla||'—']),el('span',{},[n.nome||'']),el('small',{},[(r.professor||'')+' · '+(r.sala||'sem sala')+' · '+r.sessions.map(function(s){return s.day_short+' '+H.fmtHour(s.hour);}).join(', ')])]);
        b.addEventListener('click',function(){ sel=on?sel.filter(function(i){return i!==r.id;}):sel.concat(r.id); draw(); });
        ul.appendChild(b); }); }
    list(); cat.appendChild(search); cat.appendChild(ul);
    var grid=el('div',{class:'pl-grid'}); grid.appendChild(el('div',{}));
    H.DAY_ORDER.forEach(function(d){ grid.appendChild(el('div',{class:'pl-dh'},[H.DAY_SHORT[d]])); });
    var picks=chosen(sel);
    H.HOURS.forEach(function(h){
      grid.appendChild(el('div',{class:'pl-hh'},[H.fmtHour(h)]));
      H.DAY_ORDER.forEach(function(d){
        var cell=el('div',{class:'pl-cell'+(cf[d+'-'+h]?' clash':'')});
        picks.forEach(function(r,i){ if(r.sessions.some(function(s){return s.day_num===d&&s.hour===h;})){
          var n=nm(r); cell.appendChild(el('div',{class:'pl-block',style:'background:'+COLORS[sel.indexOf(r.id)%COLORS.length]},[el('b',{},[n.sigla]),el('span',{},[r.sala||'sem sala'])])); } });
        grid.appendChild(cell); }); });
    var bar=el('div',{class:'pl-bar'});
    var sv=el('button',{type:'button',class:'edit-save-btn'},[conflictList.length?'Resolva os choques para salvar':(dirty?'Salvar plano':'Plano salvo')]);
    sv.disabled = !dirty || conflictList.length>0;
    sv.addEventListener('click',function(){
      if (findConflicts(sel).length) { draw(); return; } // nunca grava com conflito pendente
      localStorage.setItem(KEY,JSON.stringify(sel)); saved=sel.slice(); draw();
    });
    bar.appendChild(sv);
    var left=el('div',{class:'pl-main'},[bar,el('div',{class:'pl-gridwrap'},[grid])]);
    root.appendChild(el('div',{class:'pl-layout'},[cat,left]));

    /* ---------------------------------------------------------------
       MINHA SEMANA — agenda de consulta rápida, organizada por dia.
       Mostra todos os dias da semana (mesmo os livres, para que a lacuna
       na agenda fique visível) com navegação rápida por chips no topo.
       --------------------------------------------------------------- */
    var ag=el('div',{class:'pl-agenda'});
    ag.appendChild(el('h3',{},['Minha semana']));
    var sp=chosen(saved);
    if(!sp.length){
      ag.appendChild(el('div',{class:'rd-empty'},['Salve um plano para ver sua agenda organizada por dia, com disciplina, professor(a) e sala de cada aula.']));
    } else {
      var byDay = {};
      H.DAY_ORDER.forEach(function(d){ byDay[d] = []; });
      sp.forEach(function(r){ r.sessions.forEach(function(s){ if (byDay[s.day_num]) byDay[s.day_num].push({r:r,h:s.hour}); }); });

      var pills = el('div',{class:'pl-daypills'});
      H.DAY_ORDER.forEach(function(d){
        var n = byDay[d].length;
        pills.appendChild(el('a',{href:'#pl-day-'+d, class:'pl-pill'+(n?' has':'')},[H.DAY_SHORT[d], el('span',{class:'ct'},[String(n)])]));
      });
      ag.appendChild(pills);

      H.DAY_ORDER.forEach(function(d){
        var items=byDay[d].slice().sort(function(a,b){return a.h-b.h;});
        var col=el('div',{class:'pl-day', id:'pl-day-'+d},[el('h4',{},[H.DAY_FULL[d]])]);
        if(!items.length){
          col.appendChild(el('div',{class:'pl-day-empty'},['Nenhuma aula — dia livre.']));
        } else {
          items.forEach(function(it){
            var n=nm(it.r), idx=sel.indexOf(it.r.id), color=COLORS[(idx>=0?idx:0)%COLORS.length];
            col.appendChild(el('div',{class:'pl-row', style:'border-left-color:'+color},[
              el('b',{},[H.fmtHour(it.h)]),
              el('div',{},[
                el('strong',{},[(n.sigla||'—')+' — '+(n.nome||'')]),
                el('small',{},[(it.r.professor||'professor não informado')+' · '+(it.r.sala||'sem sala')])
              ])
            ]));
          });
        }
        ag.appendChild(col);
      });
    }
    root.appendChild(ag);
  }
  document.querySelector('[data-tab="plano"]').addEventListener('click',draw);
  draw();
  })();
