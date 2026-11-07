(function(){
  "use strict";
  var B=window.__BUSSOLA__, H=window.__b_helpers, el=H.el, root=document.getElementById('view-plano');
  if(!root||B.IS_PROFESSOR||!B.SESSION) return;
  var KEY='bussola_plan_'+B.SESSION.user+'_'+B.CURSO, RECS=B.RECORDS, q='';
  function get(){ try{ var v=JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v)?v:[]; }catch(e){ return []; } }
  var saved=get(), sel=saved.slice();
  var COLORS=['#3D8577','#7C5A72','#B97A22','#B65C4A','#445374','#2A5F55','#5C4155'];
  function nm(r){ return r.curr2023||r.curr2008||{}; }
  function byId(id){ return RECS.filter(function(r){return r.id===id;})[0]; }
  function chosen(list){ return list.map(byId).filter(Boolean); }
  function title(r){ var n=nm(r); return (n.sigla||'—')+' — '+(n.nome||''); }

  /* ============================================================
     VALIDAÇÃO DE CONFLITOS DE HORÁRIO
     Roda no navegador: o plano persistido fica em localStorage.
     findConflicts é consultado ANTES de alterar a seleção (sel) e
     ANTES de gravar (localStorage / saved). Conflito nunca entra
     no estado nem no armazenamento.

     Dois horários conflitam quando é o MESMO dia e os intervalos se
     sobrepõem (início..início+duração da aula do curso) — não só quando
     começam na mesma hora.
     ============================================================ */
  function findConflicts(list){
    var recs = chosen(list), out = [], seen = {};
    for (var i=0; i<recs.length; i++){
      for (var j=i+1; j<recs.length; j++){
        recs[i].sessions.forEach(function(a){
          recs[j].sessions.forEach(function(b){
            if (a.day_num !== b.day_num || !H.overlaps(a.hour, b.hour)) return;
            var start = Math.max(a.hour, b.hour), end = Math.min(a.hour, b.hour) + H.SLOT;
            var k = a.day_num+'-'+start+'-'+recs[i].id+'-'+recs[j].id;
            if (seen[k]) return;
            seen[k] = 1;
            out.push({ day:a.day_num, hour:start, end:end, hours:[a.hour,b.hour], recs:[recs[i],recs[j]] });
          });
        });
      }
    }
    return out;
  }
  function conflictIds(conflictList){
    var ids = {}; conflictList.forEach(function(c){ c.recs.forEach(function(r){ ids[r.id] = 1; }); }); return ids;
  }
  function conflictCellKeys(conflictList){
    var m={}; conflictList.forEach(function(c){ c.hours.forEach(function(h){ m[c.day+'-'+h]=1; }); }); return m;
  }
  function names(c){ return c.recs.map(title).join('  ×  '); }

  /* "Ajustar horários": fecha o aviso, leva o usuário até a grade do plano e
     destaca as turmas envolvidas no choque para ele saber o que desmarcar. */
  function goAdjust(ids){
    var target = root.querySelector('.pl-main') || root;
    try{ target.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){ target.scrollIntoView(); }
    setTimeout(function(){
      root.querySelectorAll('.pl-block, .pl-item').forEach(function(n){
        if (ids[n.getAttribute('data-rec')]){
          n.classList.add('flash-conflict');
          setTimeout(function(){ n.classList.remove('flash-conflict'); }, 2200);
        }
      });
    }, 350);
  }

  function showConflictModal(conflictList, lead){
    var prev = document.getElementById('planConflictModal');
    if (prev) prev.remove();
    var list = el('div', {class:'plan-modal-list'});
    conflictList.forEach(function(c){
      list.appendChild(el('div', {class:'plan-modal-item'}, [
        el('b', {}, [H.DAY_FULL[c.day]+' · '+H.fmtHour(c.hour)+'–'+H.fmtHour(c.end)]),
        el('span', {}, [names(c)])
      ]));
    });
    var ov, onKey;
    function close(){
      document.removeEventListener('keydown', onKey);
      if (ov && ov.parentNode) ov.remove();
    }
    onKey = function(e){ if (e.key === 'Escape') close(); };
    var btn = el('button', {type:'button', class:'edit-save-btn'}, ['Ajustar horários']);
    btn.addEventListener('click', function(){ close(); goAdjust(conflictIds(conflictList)); });
    var card = el('div', {class:'plan-modal', role:'alertdialog', 'aria-modal':'true', 'aria-labelledby':'planConflictTitle'}, [
      el('h3', {id:'planConflictTitle'}, ['Choque de horários']),
      el('p', {}, [lead]),
      list,
      btn
    ]);
    ov = el('div', {id:'planConflictModal', class:'cp-overlay'}, [card]);
    ov.addEventListener('click', function(e){ if (e.target === ov) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);
    btn.focus();
  }

  /* aviso fixo (sem popup) para o caso raro de um plano já salvo entrar em choque
     depois que um professor altera o horário de uma turma */
  function buildErrorBanner(conflictList){
    var box = el('div', {class:'plan-error', role:'alert'});
    box.appendChild(el('div', {class:'plan-error-title'}, ['Existem conflitos de horário entre as turmas selecionadas.']));
    box.appendChild(el('div', {class:'plan-error-sub'}, ['Desmarque ou troque uma das turmas indicadas antes de salvar o plano.']));
    var list = el('div', {class:'plan-error-list'});
    conflictList.forEach(function(c){
      list.appendChild(el('div', {class:'plan-error-item'}, [el('b',{},[H.DAY_FULL[c.day]+' · '+H.fmtHour(c.hour)+'–'+H.fmtHour(c.end)]), ': '+names(c)]));
    });
    box.appendChild(list);
    return box;
  }

  function draw(){
    var conflictList = findConflicts(sel), cf = conflictCellKeys(conflictList);
    var dirty=JSON.stringify(sel)!==JSON.stringify(saved);
    root.innerHTML='';
    root.appendChild(el('div',{class:'section-head'},[el('div',{},[el('h2',{},['Meu plano de aulas']),el('div',{class:'desc'},['Escolha as turmas em que você está inscrito. O painel monta a semana e avisa quando há choque de horário.'])])]));

    var turmaCount = chosen(sel).length;
    var stats = el('div', {class:'plan-stats'});
    stats.appendChild(el('article', {class:'plan-stat'}, [
      el('div', {class:'plan-stat-kicker'}, ['Quantidade de turmas']),
      el('div', {class:'plan-stat-n'}, [String(turmaCount)]),
      el('div', {class:'plan-stat-lbl'}, [turmaCount === 1 ? 'turma no plano' : 'turmas no plano']),
      el('div', {class:'plan-stat-hint'}, ['Disciplinas marcadas nesta seleção'])
    ]));
    root.appendChild(stats);

    if (conflictList.length) root.appendChild(buildErrorBanner(conflictList));

    var cat=el('div',{class:'pl-cat'}), search=el('input',{type:'search',placeholder:'Filtrar por sigla, disciplina ou professor',value:q,'aria-label':'Filtrar turmas'});
    search.addEventListener('input',function(){ q=search.value; list(); });
    var ul=el('div',{class:'pl-list'});
    function list(){ ul.innerHTML=''; var t=q.toLowerCase();
      RECS.filter(function(r){ var n=nm(r); return !t||(n.sigla+' '+n.nome+' '+(r.professor||'')).toLowerCase().indexOf(t)>=0; }).forEach(function(r){
        var n=nm(r), on=sel.indexOf(r.id)>=0;
        var b=el('button',{type:'button',class:'pl-item'+(on?' on':''),'data-rec':String(r.id),'aria-pressed':String(on)},[el('b',{},[n.sigla||'—']),el('span',{},[n.nome||'']),el('small',{},[(r.professor||'')+' · '+(r.sala||'sem sala')+' · '+(r.sessions.map(function(s){return s.day_short+' '+H.fmtHour(s.hour);}).join(', ')||'sem horário fixo')])]);
        b.addEventListener('click',function(){
          if (on){ sel = sel.filter(function(i){ return i!==r.id; }); draw(); return; }
          var next = sel.concat(r.id);
          var clashes = findConflicts(next).filter(function(c){
            return c.recs.some(function(rec){ return rec.id === r.id; });
          });
          if (clashes.length){
            showConflictModal(clashes, 'Não foi possível adicionar esta turma ao plano porque o horário conflita com outra disciplina já escolhida. Desmarque uma das duas para continuar.');
            return;
          }
          sel = next;
          draw();
        });
        ul.appendChild(b); });
      if (!ul.children.length) ul.appendChild(el('div',{class:'rd-empty',style:'padding:12px 4px;'},['Nenhuma turma encontrada.']));
    }
    list(); cat.appendChild(search); cat.appendChild(ul);
    var grid=el('div',{class:'pl-grid'}); grid.appendChild(el('div',{}));
    H.DAY_ORDER.forEach(function(d){ grid.appendChild(el('div',{class:'pl-dh'},[H.DAY_SHORT[d]])); });
    var picks=chosen(sel);
    H.HOURS.forEach(function(h){
      grid.appendChild(el('div',{class:'pl-hh'},[H.fmtHour(h)]));
      H.DAY_ORDER.forEach(function(d){
        var cell=el('div',{class:'pl-cell'+(cf[d+'-'+h]?' clash':'')});
        picks.forEach(function(r){ if(r.sessions.some(function(s){return s.day_num===d&&s.hour===h;})){
          var n=nm(r); cell.appendChild(el('div',{class:'pl-block','data-rec':String(r.id),style:'background:'+COLORS[sel.indexOf(r.id)%COLORS.length]},[el('b',{},[n.sigla]),el('span',{},[r.sala||'sem sala'])])); } });
        grid.appendChild(cell); }); });
    var bar=el('div',{class:'pl-bar'});
    var canAttempt = dirty || conflictList.length>0;
    var sv=el('button',{type:'button',class:'edit-save-btn'},[canAttempt?'Salvar plano':'Plano salvo']);
    sv.disabled = !canAttempt;
    sv.addEventListener('click',function(){
      var clashes = findConflicts(sel);
      if (clashes.length){
        showConflictModal(clashes, 'Não foi possível salvar o plano porque existem choques de horário entre as turmas. Desmarque uma das turmas indicadas e tente novamente.');
        return;
      }
      if (!H.safeSet(KEY,JSON.stringify(sel))) return;
      saved = sel.slice();
      draw();
    });
    bar.appendChild(sv);
    var left=el('div',{class:'pl-main'},[bar,el('div',{class:'pl-gridwrap'},[grid])]);
    root.appendChild(el('div',{class:'pl-layout'},[cat,left]));

    /* Minha semana — grade visual do plano já salvo, um dia por coluna. */
    var ag=el('div',{class:'pl-agenda'});
    ag.appendChild(el('div',{class:'pl-week-intro'},[
      el('h3',{},['Minha semana']),
      el('p',{},['Consulta rápida do plano salvo: cada coluna é um dia e cada card é uma aula, com horário, professor(a) e sala.'])
    ]));
    var sp=chosen(saved);
    if(!sp.length){
      ag.appendChild(el('div',{class:'pl-week-placeholder'},['Salve um plano para ver a semana organizada, com disciplina, professor(a) e sala de cada aula.']));
    } else {
      var byDay = {};
      H.DAY_ORDER.forEach(function(d){ byDay[d] = []; });
      sp.forEach(function(r){ r.sessions.forEach(function(s){ if (byDay[s.day_num]) byDay[s.day_num].push({r:r,h:s.hour}); }); });

      var week = el('div',{class:'pl-week'});
      H.DAY_ORDER.forEach(function(d){
        var items=byDay[d].slice().sort(function(a,b){return a.h-b.h;});
        var col=el('section',{class:'pl-week-col'+(items.length?'':' is-free'), 'aria-label':H.DAY_FULL[d]});
        col.appendChild(el('div',{class:'pl-week-dayhead'},[
          el('span',{class:'pl-week-dayname'},[H.DAY_FULL[d].replace('-feira','')]),
          el('span',{class:'pl-week-badge'},[items.length? String(items.length)+(items.length===1?' aula':' aulas') : 'livre'])
        ]));
        var body=el('div',{class:'pl-week-body'});
        if(!items.length){
          body.appendChild(el('div',{class:'pl-week-empty'},['Nenhuma aula neste dia.']));
        } else {
          items.forEach(function(it){
            var n=nm(it.r), idx=saved.indexOf(it.r.id), color=COLORS[(idx>=0?idx:0)%COLORS.length];
            body.appendChild(el('article',{class:'pl-week-card', style:'border-left-color:'+color},[
              el('div',{class:'pl-week-time'},[H.fmtRange(it.h)]),
              el('div',{class:'pl-week-sigla'},[n.sigla||'—']),
              el('div',{class:'pl-week-name'},[n.nome||'']),
              el('div',{class:'pl-week-meta'},[(it.r.professor||'professor não informado')+' · '+(it.r.sala||'sem sala')])
            ]));
          });
        }
        col.appendChild(body);
        week.appendChild(col);
      });
      ag.appendChild(week);
    }
    root.appendChild(ag);
  }
  document.querySelector('[data-tab="plano"]').addEventListener('click',draw);
  draw();
  })();
