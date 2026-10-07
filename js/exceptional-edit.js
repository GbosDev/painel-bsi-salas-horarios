(function(){
  "use strict";
  var B=window.__BUSSOLA__, H=window.__b_helpers, el=H.el;
  if(!B || !B.IS_PROFESSOR){ window.__b_exceptional = { open:function(){} }; return; }
  var C=B.CURSO;

  function nm(r){ return r.curr2023||r.curr2008||{}; }
  function sel(opts,val,ph){ var s=el('select',{}); if(ph) s.appendChild(el('option',{value:''},[ph])); opts.forEach(function(o){ var op=el('option',{value:String(o[0])},[o[1]]); if(String(o[0])===String(val)) op.selected=true; s.appendChild(op); }); return s; }
  function fld(l,n){ return el('div',{class:'edit-field'},[el('label',{},[l]),n]); }
  function inUse(room){ return B.RECORDS.filter(function(r){return r.sala===room;}).length; }

  var overlay = null;

  function close(){ if (overlay){ overlay.remove(); overlay=null; } }

  function motivoField(){
    var ta = el('textarea', {rows:'2', placeholder:'Ex.: troca de sala por conflito de reserva para prova extra em 12/11.'});
    var wrap = el('div', {class:'edit-field'}, [
      el('label',{},['Motivo (obrigatório — fica no histórico)']),
      ta
    ]);
    return { wrap:wrap, input:ta };
  }

  function diffPatch(rec, patch){
    var antes = {}, depois = {};
    ['professor','sala','vagas'].forEach(function(k){
      var before = rec[k], after = patch[k];
      if (String(before||'') !== String(after||'')){ antes[k]=before; depois[k]=after; }
    });
    if (patch.sessions){
      var beforeStr = (rec.sessions||[]).map(function(s){return s.day_short+' '+H.fmtHour(s.hour);}).join(' · ');
      var afterStr = patch.sessions.map(function(s){return s.day_short+' '+H.fmtHour(s.hour);}).join(' · ');
      if (beforeStr !== afterStr){ antes.horarios=beforeStr||'—'; depois.horarios=afterStr||'—'; }
    }
    return { antes:antes, depois:depois };
  }

  function buildEditForm(rec){
    var n = nm(rec);
    var profInput = el('input', {type:'text', value: rec.professor||''});
    var salaSelect = sel(H.ALL_ROOMS.slice().sort().map(function(r){return [r,r];}), rec.sala||'', 'sem sala fixa');
    var vagasInput = el('input', {type:'number', value: rec.vagas||0});
    var working = rec.sessions.map(function(s){ return {day_num:s.day_num, hour:s.hour}; }), wrap = el('div',{class:'edit-sessions'});
    function paint(){ wrap.innerHTML=''; working.forEach(function(s,i){ var d=sel(H.DAY_ORDER.map(function(x){return [x,H.DAY_FULL[x]];}),s.day_num), h=sel(H.HOURS.map(function(x){return [x,H.fmtHour(x)];}),s.hour), x=el('button',{type:'button'},['×']);
      d.onchange=function(){s.day_num=+d.value;}; h.onchange=function(){s.hour=+h.value;}; x.onclick=function(){working.splice(i,1);paint();}; wrap.appendChild(el('div',{class:'edit-session-row'},[d,h,x])); }); }
    paint();
    var add=el('button',{type:'button',class:'edit-add-session'},['+ adicionar horário']); add.onclick=function(){working.push({day_num:1,hour:H.HOURS[0]});paint();};
    var motivo = motivoField();
    var msg = el('div', {class:'auth-error', hidden:true}, ['Descreva o motivo (mín. 8 caracteres).']);

    var form = el('div', {class:'edit-form'}, [
      el('div', {class:'exmod-subject'}, [(n.sigla||'—')+' — '+(n.nome||'')]),
      fld('Professor(a)', profInput),
      fld('Sala', salaSelect),
      fld('Vagas', vagasInput),
      el('label',{class:'ad-lbl'},['Horários semanais']), wrap, add,
      motivo.wrap, msg
    ]);

    var ok=el('button',{type:'button',class:'edit-save-btn'},['Salvar ajuste excepcional']), no=el('button',{type:'button',class:'edit-cancel-btn'},['Cancelar']);
    no.onclick = close;
    ok.onclick = function(){
      if (motivo.input.value.trim().length < 8){ msg.hidden = false; return; }
      var patch = {
        professor: profInput.value.trim(), sala: salaSelect.value||null, vagas: parseInt(vagasInput.value,10)||0,
        sessions: working.map(function(s){ return {day_num:s.day_num, day_label:H.DAY_FULL[s.day_num], day_short:H.DAY_SHORT[s.day_num], hour:s.hour}; })
      };
      var diff = diffPatch(rec, patch);
      H.saveOverride(rec.id, patch);
      H.logAudit({
        curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:'exceptional_edit',
        turmaSigla:n.sigla||'—', turmaNome:n.nome||'—',
        motivo: motivo.input.value.trim(), antes:diff.antes, depois:diff.depois
      });
      BussolaStore.refresh();
    };
    form.appendChild(el('div',{class:'edit-actions'},[ok,no]));
    return form;
  }

  function buildNewTurmaForm(){
    var inp=function(p,t){ return el('input',{type:t||'text',placeholder:p}); };
    var sigla=inp('Sigla'),nome=inp('Disciplina'),cod=inp('Código'),per=inp('Período'),prof=inp('Professor(a)'),vagas=inp('Vagas','number');
    var sala=sel(H.ALL_ROOMS.slice().sort().map(function(r){return [r,r];}),'','Sem sala fixa'), rows=[[1,H.HOURS[0]]], wrap=el('div',{class:'edit-sessions'});
    function paint(){ wrap.innerHTML=''; rows.forEach(function(s,i){ var d=sel(H.DAY_ORDER.map(function(x){return [x,H.DAY_FULL[x]];}),s[0]), h=sel(H.HOURS.map(function(x){return [x,H.fmtHour(x)];}),s[1]), x=el('button',{type:'button'},['×']);
      d.onchange=function(){s[0]=+d.value;}; h.onchange=function(){s[1]=+h.value;}; x.onclick=function(){rows.splice(i,1);paint();}; wrap.appendChild(el('div',{class:'edit-session-row'},[d,h,x])); }); }
    paint();
    var add=el('button',{type:'button',class:'edit-add-session'},['+ adicionar horário']); add.onclick=function(){rows.push([1,H.HOURS[0]]);paint();};
    var motivo = motivoField();
    var err=el('div',{class:'auth-error',hidden:true},['Informe sigla, disciplina, ao menos um horário e o motivo (mín. 8 caracteres).']);
    var form = el('div', {class:'edit-form'}, [
      el('div',{class:'ad-grid'},[fld('Sigla',sigla),fld('Disciplina',nome),fld('Código',cod),fld('Período',per),fld('Professor(a)',prof),fld('Vagas',vagas),fld('Sala',sala)]),
      el('label',{class:'ad-lbl'},['Horários semanais']), wrap, add, motivo.wrap, err
    ]);
    var ok=el('button',{type:'button',class:'edit-save-btn'},['Criar turma (excepcional)']), no=el('button',{type:'button',class:'edit-cancel-btn'},['Cancelar']);
    no.onclick = close;
    ok.onclick = function(){
      if (!sigla.value.trim()||!nome.value.trim()||!rows.length||motivo.input.value.trim().length<8){ err.hidden=false; return; }
      var newRec = {curr2008:null,curr2023:{nome:nome.value.trim(),sigla:sigla.value.trim(),codigo:cod.value.trim(),periodo:per.value.trim()||'1'},professor:prof.value.trim(),sala:sala.value||null,vagas:+vagas.value||0,section:'regular',
        sessions:rows.map(function(s){return {day_num:s[0],day_label:H.DAY_FULL[s[0]],day_short:H.DAY_SHORT[s[0]],hour:s[1]};})};
      BussolaStore.addRecord(C, newRec);
      H.logAudit({
        curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:'exceptional_create',
        turmaSigla:sigla.value.trim(), turmaNome:nome.value.trim(), motivo: motivo.input.value.trim(),
        antes:{}, depois:{professor:prof.value.trim(), sala:sala.value||'—', vagas:+vagas.value||0}
      });
      BussolaStore.refresh();
    };
    form.appendChild(el('div',{class:'edit-actions'},[ok,no]));
    return form;
  }

  function buildDeleteConfirm(rec, onCancel){
    var n = nm(rec);
    var motivo = motivoField();
    var msg = el('div', {class:'auth-error', hidden:true}, ['Descreva o motivo da exclusão (mín. 8 caracteres).']);
    var form = el('div', {class:'edit-form'}, [
      el('div', {class:'exmod-subject'}, [(n.sigla||'—')+' — '+(n.nome||'')]),
      el('div', {class:'desc'}, ['A turma será removida da grade.']),
      motivo.wrap, msg
    ]);
    var ok=el('button',{type:'button',class:'edit-save-btn'},['Confirmar exclusão']), no=el('button',{type:'button',class:'edit-cancel-btn'},['Cancelar']);
    no.onclick = onCancel;
    ok.onclick = function(){
      if (motivo.input.value.trim().length < 8){ msg.hidden = false; return; }
      BussolaStore.removeRecord(C, rec.id);
      H.logAudit({
        curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:'exceptional_delete',
        turmaSigla:n.sigla||'—', turmaNome:n.nome||'—', motivo: motivo.input.value.trim(),
        antes:{professor:rec.professor||'—', sala:rec.sala||'—'}, depois:{}
      });
      BussolaStore.refresh();
    };
    form.appendChild(el('div',{class:'edit-actions'},[ok,no]));
    return form;
  }

  /* ============================================================
     CATÁLOGO DE SALAS — gestão de pouca frequência, por isso vive
     aqui dentro do ajuste excepcional em vez de numa aba própria.
     ============================================================ */
  function roomsSection(){
    var rn = el('input',{type:'text',placeholder:'Nova sala (ex.: Sala 301)'});
    var ra = el('button',{type:'button',class:'edit-save-btn'},['Adicionar']);
    ra.onclick = function(){
      var v = rn.value.trim(); if (!v) return;
      BussolaStore.addRoom(C, v);
      H.logAudit({ curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:'sala_add', turmaSigla:'—', turmaNome:'Catálogo de salas', motivo:'Sala adicionada', antes:{}, depois:{sala:v} });
      BussolaStore.refresh();
    };
    var chips = el('div',{class:'ad-rooms'});
    H.ALL_ROOMS.slice().sort().forEach(function(r){
      var u = inUse(r), x = el('button',{type:'button',title:u?'Em uso por '+u+' turma(s)':'Remover'},['×']);
      x.onclick = function(){
        if (u){ x.parentNode.classList.add('shake'); setTimeout(function(){x.parentNode.classList.remove('shake');},400); return; }
        BussolaStore.removeRoom(C, r);
        H.logAudit({ curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:'sala_remove', turmaSigla:'—', turmaNome:'Catálogo de salas', motivo:'Sala removida', antes:{sala:r}, depois:{} });
        BussolaStore.refresh();
      };
      chips.appendChild(el('span',{class:'ad-chip'+(u?' used':'')},[r+(u?' · '+u:''),x]));
    });
    return el('div',{class:'ad-card'},[el('div',{class:'ad-head'},[el('h3',{style:'margin:0;'},['Salas'])]),el('div',{class:'ad-add'},[rn,ra]),chips]);
  }

  /* ============================================================
     SHELL DO MODAL — busca de turma, edição pontual e catálogo de
     salas, acessível de dentro da aba "Atualizar dados".
     ============================================================ */
  function buildShell(){
    var q = '';
    var body = el('div', {class:'exmod-body'});
    var listWrap = el('div', {});
    var formWrap = el('div', {id:'exmodFormWrap'});

    function showList(){
      formWrap.innerHTML = '';
      listWrap.innerHTML = '';
      var search = el('input', {type:'text', placeholder:'Buscar turma por sigla, disciplina, professor ou sala…', value:q});
      search.oninput = function(){ q = search.value; renderRows(); };
      var tb = el('tbody', {});
      function renderRows(){
        tb.innerHTML = '';
        var t = q.toLowerCase();
        B.RECORDS.filter(function(r){ var n=nm(r); return !t || (n.sigla+' '+n.nome+' '+(r.professor||'')+' '+(r.sala||'')).toLowerCase().indexOf(t)>=0; }).forEach(function(r){
          var n = nm(r);
          var eBtn = el('button',{type:'button',class:'ad-btn'},['Editar']);
          var dBtn = el('button',{type:'button',class:'ad-btn danger'},['Excluir']);
          eBtn.onclick = function(){ formWrap.innerHTML=''; formWrap.appendChild(buildEditForm(r)); formWrap.scrollIntoView({behavior:'smooth', block:'nearest'}); };
          dBtn.onclick = function(){ formWrap.innerHTML=''; formWrap.appendChild(buildDeleteConfirm(r, function(){ formWrap.innerHTML=''; })); formWrap.scrollIntoView({behavior:'smooth', block:'nearest'}); };
          tb.appendChild(el('tr',{},[
            el('td',{},[n.sigla||'']), el('td',{},[n.nome||'']), el('td',{},[r.professor||'—']), el('td',{},[r.sala||'—']),
            el('td',{},[r.sessions.map(function(x){return x.day_short+' '+H.fmtHour(x.hour);}).join(' · ')||'—']),
            el('td',{class:'ad-act'},[eBtn,dBtn])
          ]));
        });
      }
      renderRows();
      var th = el('thead',{},[el('tr',{},['Sigla','Disciplina','Professor','Sala','Horários',''].map(function(h){return el('th',{},[h]);}))]);
      listWrap.appendChild(el('div',{class:'ad-head'},[el('h3',{style:'margin:0;'},['Turmas existentes']), search]));
      listWrap.appendChild(el('div',{class:'index-table-wrap'},[el('table',{class:'index-table'},[th,tb])]));
    }
    showList();

    var newBtn = el('button', {type:'button', class:'edit-save-btn', style:'margin-bottom:14px;'}, ['+ Nova turma (caso excepcional)']);
    newBtn.onclick = function(){ formWrap.innerHTML=''; formWrap.appendChild(buildNewTurmaForm()); formWrap.scrollIntoView({behavior:'smooth', block:'nearest'}); };

    body.appendChild(el('div', {class:'exception-banner'}, [
      el('div',{class:'exception-banner-title'},['⚠ Uso excepcional']),
      el('div',{},['Correções pontuais e urgentes. Para o semestre inteiro, use a importação por planilha.'])
    ]));
    body.appendChild(newBtn);
    body.appendChild(formWrap);
    body.appendChild(listWrap);
    body.appendChild(roomsSection());
    return body;
  }

  function open(){
    close();
    var card = el('div', {class:'exmod-card'});
    var head = el('div', {class:'exmod-head'}, [
      el('h3', {}, ['Ajuste excepcional']),
      (function(){ var b = el('button', {type:'button', class:'cp-close'}, ['Fechar ×']); b.onclick = close; return b; })()
    ]);
    card.appendChild(head);
    card.appendChild(buildShell());
    overlay = el('div', {class:'cp-overlay exmod-overlay'}, [card]);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e){ if (e.key==='Escape'){ close(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(overlay);
  }

  window.__b_exceptional = { open: open };
})();
