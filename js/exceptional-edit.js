(function(){
  "use strict";
  var B=window.__BUSSOLA__, H=window.__b_helpers, el=H.el;
  if(!B || !B.IS_PROFESSOR){ window.__b_exceptional = { open:function(){} }; return; }
  var C=B.CURSO;

  /* ============================================================
     AJUSTE EXCEPCIONAL — janela de correções pontuais
     ------------------------------------------------------------
     Layout em duas colunas no desktop (lista de turmas | editor) e em
     uma coluna no celular; nenhuma tabela larga, então não há rolagem
     lateral em nenhum tamanho de tela. Duas abas: Turmas e Salas.
     ============================================================ */

  function nm(r){ return r.curr2023||r.curr2008||{}; }
  function sel(opts,val,ph){ var s=el('select',{}); if(ph) s.appendChild(el('option',{value:''},[ph])); opts.forEach(function(o){ var op=el('option',{value:String(o[0])},[o[1]]); if(String(o[0])===String(val)) op.selected=true; s.appendChild(op); }); return s; }
  function fld(l,n,cls){ return el('div',{class:'xf-field'+(cls?' '+cls:'')},[el('label',{},[l]),n]); }
  function inUse(room){ return B.RECORDS.filter(function(r){return r.sala===room;}).length; }
  function roomOptions(){ return H.ALL_ROOMS.slice().sort(function(a,b){ return a.localeCompare(b,'pt-BR',{numeric:true}); }).map(function(r){return [r,r];}); }
  function sessLabel(list){ return (list||[]).map(function(x){return x.day_short+' '+H.fmtHour(x.hour);}).join(' · ')||'—'; }
  function audit(tipo, sigla, nome, motivo, antes, depois){
    H.logAudit({ curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:tipo, turmaSigla:sigla, turmaNome:nome, motivo:motivo, antes:antes, depois:depois });
  }

  var overlay = null, onKey = null;

  function close(){
    if (onKey){ document.removeEventListener('keydown', onKey); onKey = null; }
    if (overlay){ overlay.remove(); overlay=null; }
    document.documentElement.classList.remove('modal-open');
  }

  function motivoField(){
    var ta = el('textarea', {rows:'2', placeholder:'Ex.: troca de sala por conflito de reserva para prova extra em 12/11.'});
    return { wrap: fld('Motivo (obrigatório — fica no histórico)', ta, 'xf-wide'), input:ta };
  }

  function diffPatch(rec, patch){
    var antes = {}, depois = {};
    ['professor','sala','vagas'].forEach(function(k){
      var before = rec[k], after = patch[k];
      if (String(before||'') !== String(after||'')){ antes[k]=before||'—'; depois[k]=after||'—'; }
    });
    if (patch.sessions){
      var beforeStr = sessLabel(rec.sessions), afterStr = sessLabel(patch.sessions);
      if (beforeStr !== afterStr){ antes.horarios=beforeStr; depois.horarios=afterStr; }
    }
    return { antes:antes, depois:depois };
  }

  /* editor de horários semanais: linhas "dia | horário | ×" que quebram bem em qualquer largura */
  function sessionsEditor(initial){
    var rows = initial.map(function(s){ return {day:s.day_num, hour:s.hour}; });
    var wrap = el('div',{class:'xf-sessions'});
    function paint(){
      wrap.innerHTML='';
      if (!rows.length) wrap.appendChild(el('div',{class:'xf-empty'},['Sem horário fixo. Use “+ adicionar horário”.']));
      rows.forEach(function(s,i){
        var d=sel(H.DAY_ORDER.map(function(x){return [x,H.DAY_FULL[x].replace('-feira','')];}),s.day);
        var h=sel(H.HOURS.map(function(x){return [x,H.fmtRange(x)];}),s.hour);
        var x=el('button',{type:'button',class:'xf-del','aria-label':'Remover horário',title:'Remover horário'},['×']);
        d.setAttribute('aria-label','Dia'); h.setAttribute('aria-label','Horário');
        d.onchange=function(){ s.day=+d.value; }; h.onchange=function(){ s.hour=+h.value; };
        x.onclick=function(){ rows.splice(i,1); paint(); };
        wrap.appendChild(el('div',{class:'xf-session'},[d,h,x]));
      });
    }
    paint();
    var add=el('button',{type:'button',class:'edit-add-session'},['+ adicionar horário']);
    add.onclick=function(){ rows.push({day:1,hour:H.HOURS[0]}); paint(); };
    return {
      node: el('div',{class:'xf-wide'},[el('label',{class:'xf-lbl'},['Horários semanais']), wrap, add]),
      /* remove duplicatas exatas (mesmo dia e hora) antes de gravar */
      value: function(){
        var seen={}, out=[];
        rows.forEach(function(s){ var k=s.day+'-'+s.hour; if(seen[k]) return; seen[k]=1; out.push({day_num:s.day, day_label:H.DAY_FULL[s.day], day_short:H.DAY_SHORT[s.day], hour:s.hour}); });
        return out;
      }
    };
  }

  function actions(okLabel, onOk, onCancel, danger){
    var ok=el('button',{type:'button',class:'edit-save-btn'+(danger?' is-danger':'')},[okLabel]);
    var no=el('button',{type:'button',class:'edit-cancel-btn'},['Cancelar']);
    ok.onclick=onOk; no.onclick=onCancel;
    return el('div',{class:'xf-actions'},[ok,no]);
  }
  function errBox(msg){ return el('div',{class:'auth-error xf-wide',hidden:true,role:'alert'},[msg]); }
  function show(box, msg){ if (msg) box.textContent = msg; box.hidden = false; }

  /* ---------------- formulários (coluna do editor) ---------------- */
  function buildEditForm(rec, onDone){
    var n = nm(rec);
    var profInput = el('input', {type:'text', value: rec.professor||'', autocomplete:'off'});
    var salaSelect = sel(roomOptions(), rec.sala||'', 'sem sala fixa');
    var vagasInput = el('input', {type:'number', min:'0', inputmode:'numeric', value: rec.vagas||0});
    var sess = sessionsEditor(rec.sessions);
    var motivo = motivoField();
    var msg = errBox('');

    return el('div', {class:'xf'}, [
      el('div', {class:'xf-title'}, [el('span',{class:'xf-kicker'},['Editando turma']), el('b',{},[(n.sigla||'—')+' — '+(n.nome||'')])]),
      el('div',{class:'xf-grid'},[
        fld('Professor(a)', profInput, 'xf-wide'),
        fld('Sala', salaSelect),
        fld('Vagas', vagasInput),
        sess.node,
        motivo.wrap,
        msg
      ]),
      actions('Salvar ajuste', function(){
        if (motivo.input.value.trim().length < 8){ show(msg, 'Descreva o motivo (mín. 8 caracteres).'); return; }
        var patch = {
          professor: profInput.value.trim(), sala: salaSelect.value||null, vagas: parseInt(vagasInput.value,10)||0,
          sessions: sess.value()
        };
        var diff = diffPatch(rec, patch);
        if (!Object.keys(diff.depois).length){ show(msg, 'Nenhuma alteração detectada — mude algum campo antes de salvar.'); return; }
        if (!H.saveOverride(rec.id, patch)) return;
        audit('exceptional_edit', n.sigla||'—', n.nome||'—', motivo.input.value.trim(), diff.antes, diff.depois);
        BussolaStore.refresh();
      }, onDone)
    ]);
  }

  function buildNewTurmaForm(onDone){
    var inp=function(p,t,extra){ var i=el('input',Object.assign({type:t||'text',placeholder:p,autocomplete:'off'},extra||{})); return i; };
    var sigla=inp('Ex.: ALGPROG'),nome=inp('Nome da disciplina'),cod=inp('Ex.: TIN0222'),per=inp('Ex.: 1'),prof=inp('Nome do(a) professor(a)'),vagas=inp('0','number',{min:'0',inputmode:'numeric'});
    var sala=sel(roomOptions(),'','Sem sala fixa');
    var sess = sessionsEditor([{day_num:1,hour:H.HOURS[0]}]);
    var motivo = motivoField();
    var err=errBox('Informe sigla, disciplina, ao menos um horário e o motivo (mín. 8 caracteres).');
    return el('div', {class:'xf'}, [
      el('div', {class:'xf-title'}, [el('span',{class:'xf-kicker'},['Caso excepcional']), el('b',{},['Nova turma'])]),
      el('div',{class:'xf-grid'},[
        fld('Sigla *',sigla), fld('Código',cod),
        fld('Disciplina *',nome,'xf-wide'),
        fld('Período',per), fld('Vagas',vagas),
        fld('Professor(a)',prof,'xf-wide'),
        fld('Sala',sala,'xf-wide'),
        sess.node, motivo.wrap, err
      ]),
      actions('Criar turma', function(){
        var sessions = sess.value();
        if (!sigla.value.trim()||!nome.value.trim()||!sessions.length||motivo.input.value.trim().length<8){ show(err); return; }
        var newRec = {curr2008:null,curr2023:{nome:nome.value.trim(),sigla:sigla.value.trim(),codigo:cod.value.trim(),periodo:per.value.trim()||'1'},professor:prof.value.trim(),sala:sala.value||null,vagas:parseInt(vagas.value,10)||0,section:'regular',sessions:sessions};
        BussolaStore.addRecord(C, newRec);
        audit('exceptional_create', sigla.value.trim(), nome.value.trim(), motivo.input.value.trim(), {},
          {professor:prof.value.trim()||'—', sala:sala.value||'—', vagas:parseInt(vagas.value,10)||0, horarios:sessLabel(sessions)});
        BussolaStore.refresh();
      }, onDone)
    ]);
  }

  function buildDeleteConfirm(rec, onDone){
    var n = nm(rec);
    var motivo = motivoField();
    var msg = errBox('Descreva o motivo da exclusão (mín. 8 caracteres).');
    return el('div', {class:'xf'}, [
      el('div', {class:'xf-title danger'}, [el('span',{class:'xf-kicker'},['Excluir turma']), el('b',{},[(n.sigla||'—')+' — '+(n.nome||'')])]),
      el('div', {class:'xf-grid'},[
        el('div',{class:'xf-wide xf-note'},['A turma será removida da grade deste curso. A ação fica registrada no histórico.']),
        motivo.wrap, msg
      ]),
      actions('Confirmar exclusão', function(){
        if (motivo.input.value.trim().length < 8){ show(msg); return; }
        BussolaStore.removeRecord(C, rec.id);
        audit('exceptional_delete', n.sigla||'—', n.nome||'—', motivo.input.value.trim(),
          {professor:rec.professor||'—', sala:rec.sala||'—', horarios:sessLabel(rec.sessions)}, {});
        BussolaStore.refresh();
      }, onDone, true)
    ]);
  }

  /* ---------------- aba Turmas: lista | editor ---------------- */
  function turmasPanel(){
    var q = '', selectedId = null;
    var editor = el('div', {class:'xt-editor'});
    var listBox = el('div', {class:'xt-list'});
    var count = el('span', {class:'xt-count'});

    function placeholder(){
      editor.innerHTML = '';
      editor.classList.remove('has-form');
      editor.appendChild(el('div', {class:'xt-placeholder'}, [
        el('div', {class:'xt-ph-ico'}, ['✎']),
        el('b', {}, ['Selecione uma turma']),
        el('span', {}, ['Clique em “Editar” ou “Excluir” na lista, ou crie uma turma excepcional.'])
      ]));
    }
    function openForm(node, id){
      selectedId = id;
      editor.innerHTML = '';
      editor.classList.add('has-form');
      editor.appendChild(node);
      markSelected();
      /* no celular o editor fica abaixo da lista: leva o usuário até ele */
      if (window.matchMedia && window.matchMedia('(max-width: 860px)').matches){
        try{ editor.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){ editor.scrollIntoView(); }
      } else {
        editor.scrollTop = 0;
      }
    }
    function backToList(){ selectedId = null; placeholder(); markSelected(); }
    function markSelected(){
      Array.prototype.forEach.call(listBox.children, function(row){
        row.classList.toggle('selected', row.getAttribute('data-id') === String(selectedId));
      });
    }

    function renderRows(){
      listBox.innerHTML = '';
      var t = q.toLowerCase().trim();
      var recs = B.RECORDS.filter(function(r){ var n=nm(r); return !t || ((n.sigla||'')+' '+(n.nome||'')+' '+(r.professor||'')+' '+(r.sala||'')).toLowerCase().indexOf(t)>=0; });
      count.textContent = recs.length + (recs.length===1?' turma':' turmas');
      if (!recs.length) listBox.appendChild(el('div',{class:'xf-empty'},['Nenhuma turma encontrada.']));
      recs.forEach(function(r){
        var n = nm(r);
        var eBtn = el('button',{type:'button',class:'ad-btn'},['Editar']);
        var dBtn = el('button',{type:'button',class:'ad-btn danger'},['Excluir']);
        eBtn.onclick = function(){ openForm(buildEditForm(r, backToList), r.id); };
        dBtn.onclick = function(){ openForm(buildDeleteConfirm(r, backToList), r.id); };
        listBox.appendChild(el('div',{class:'xt-row','data-id':String(r.id)},[
          el('div',{class:'xt-main'},[
            el('span',{class:'xt-sigla'},[n.sigla||'—']),
            el('span',{class:'xt-nome'},[n.nome||''])
          ]),
          el('div',{class:'xt-meta'},[
            el('span',{},[el('i',{},['Prof.']), r.professor||'—']),
            el('span',{},[el('i',{},['Sala']), r.sala||'—']),
            el('span',{},[el('i',{},['Horários']), sessLabel(r.sessions)])
          ]),
          el('div',{class:'xt-act'},[eBtn,dBtn])
        ]));
      });
      markSelected();
    }

    var search = el('input', {type:'search', placeholder:'Buscar por sigla, disciplina, professor ou sala…', 'aria-label':'Buscar turma', autocomplete:'off'});
    search.oninput = function(){ q = search.value; renderRows(); };
    var newBtn = el('button', {type:'button', class:'edit-save-btn xt-new'}, ['+ Nova turma']);
    newBtn.onclick = function(){ openForm(buildNewTurmaForm(backToList), null); };

    renderRows(); placeholder();

    return el('div', {class:'xt'}, [
      el('div', {class:'xt-left'}, [
        el('div', {class:'xt-tools'}, [search, newBtn]),
        count,
        listBox
      ]),
      editor
    ]);
  }

  /* ---------------- aba Salas ---------------- */
  function roomsPanel(){
    var rn = el('input',{type:'text',placeholder:'Nova sala (ex.: Sala 301)','aria-label':'Nome da nova sala',autocomplete:'off'});
    var ra = el('button',{type:'button',class:'edit-save-btn'},['Adicionar sala']);
    function addRoom(){
      var v = rn.value.trim(); if (!v) return;
      if (H.ALL_ROOMS.indexOf(v) >= 0){ rn.value=''; rn.placeholder='Essa sala já existe'; return; }
      BussolaStore.addRoom(C, v);
      audit('sala_add', '—', 'Catálogo de salas', 'Sala adicionada', {}, {sala:v});
      BussolaStore.refresh();
    }
    ra.onclick = addRoom;
    rn.addEventListener('keydown', function(e){ if (e.key==='Enter'){ e.preventDefault(); addRoom(); } });
    var chips = el('div',{class:'ad-rooms'});
    H.ALL_ROOMS.slice().sort(function(a,b){ return a.localeCompare(b,'pt-BR',{numeric:true}); }).forEach(function(r){
      var u = inUse(r), x = el('button',{type:'button','aria-label':u?'Sala em uso, não pode ser removida':'Remover '+r,title:u?'Em uso por '+u+' turma(s) — remova ou mude as turmas antes':'Remover'},['×']);
      x.onclick = function(){
        if (u){ x.parentNode.classList.add('shake'); setTimeout(function(){x.parentNode.classList.remove('shake');},400); return; }
        BussolaStore.removeRoom(C, r);
        audit('sala_remove', '—', 'Catálogo de salas', 'Sala removida', {sala:r}, {});
        BussolaStore.refresh();
      };
      chips.appendChild(el('span',{class:'ad-chip'+(u?' used':'')},[r+(u?' · '+u:''),x]));
    });
    return el('div',{class:'xs'},[
      el('div',{class:'xs-add'},[rn,ra]),
      el('p',{class:'xf-note'},['Salas em uso (com o número de turmas ao lado) não podem ser removidas.']),
      chips
    ]);
  }

  /* ---------------- estrutura da janela ---------------- */
  function open(){
    close();
    var panelWrap = el('div', {class:'exmod-panel'});
    var tabs = el('div', {class:'exmod-tabs', role:'tablist'});
    var cache = {};
    function go(name){
      Array.prototype.forEach.call(tabs.children, function(b){
        var on = b.getAttribute('data-p') === name;
        b.setAttribute('aria-selected', String(on)); b.classList.toggle('on', on);
      });
      panelWrap.innerHTML = '';
      if (!cache[name]) cache[name] = name === 'salas' ? roomsPanel() : turmasPanel();
      panelWrap.appendChild(cache[name]);
      panelWrap.setAttribute('data-panel', name);
    }
    [['turmas','Turmas'],['salas','Catálogo de salas']].forEach(function(t){
      var b = el('button', {type:'button', role:'tab', class:'exmod-tab', 'data-p':t[0], 'aria-selected':'false'}, [t[1]]);
      b.onclick = function(){ go(t[0]); };
      tabs.appendChild(b);
    });

    var closeBtn = el('button', {type:'button', class:'cp-close exmod-close', 'aria-label':'Fechar'}, ['Fechar ×']);
    closeBtn.onclick = close;
    var head = el('div', {class:'exmod-head'}, [
      el('div', {}, [el('h3', {}, ['Ajuste excepcional']), el('div',{class:'exmod-sub'},[(B.COURSE&&B.COURSE.nome)||''])]),
      closeBtn
    ]);
    var banner = el('div', {class:'exception-banner'}, [
      el('div',{class:'exception-banner-title'},['⚠ Uso excepcional']),
      el('div',{},['Correções pontuais e urgentes. Para o semestre inteiro, use a importação por planilha.'])
    ]);
    var card = el('div', {class:'exmod-card', role:'dialog', 'aria-modal':'true', 'aria-label':'Ajuste excepcional'}, [
      head,
      el('div', {class:'exmod-body'}, [banner, tabs, panelWrap])
    ]);
    overlay = el('div', {class:'cp-overlay exmod-overlay'}, [card]);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
    onKey = function(e){ if (e.key==='Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('modal-open');
    document.body.appendChild(overlay);
    go('turmas');
  }

  window.__b_exceptional = { open: open };
})();
