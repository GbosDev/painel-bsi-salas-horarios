(function(){
  "use strict";
  
  /* ============================================================
     DATA — parsed from the uploaded CSV (curso ativo escolhido pela URL
     ?curso=bsi|ibio|eng — BSI é o padrão e tem a grade completa; os
     outros dois são versões de escopo com dados de exemplo)
     ============================================================ */
  var CURSO = new URLSearchParams(location.search).get('curso') || 'bsi';
  var PICK_GROUP = (window.BUSSOLA_GROUPS && window.BUSSOLA_GROUPS[CURSO]) ? CURSO : null;
  if (PICK_GROUP) CURSO = 'ibio-bcb';
  if (!window.BUSSOLA_COURSES || !window.BUSSOLA_COURSES[CURSO]) CURSO = 'bsi';
  var COURSE = (window.BUSSOLA_COURSES && window.BUSSOLA_COURSES[CURSO]) || { id:'bsi', sigla:'BSI', nome:'Sistemas de Informação', status:'completo' };
  var RECORDS = (window.BUSSOLA_DATASETS && window.BUSSOLA_DATASETS[CURSO]) || window.BSI_DATA || [];
  if (window.BussolaStore) RECORDS = BussolaStore.apply(CURSO, RECORDS);
  
  /* edições de professor (horário/sala/professor) ficam salvas por curso,
     sobrepostas aos dados originais só neste navegador — não há backend */
  var OVERRIDES_KEY = 'bussola_overrides_' + CURSO;
  function loadOverrides(){
    try{ return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {}; }catch(e){ return {}; }
  }
  /* Safari em aba privada (e alguns navegadores com dados bloqueados) lança
     exceção em setItem — nesse caso a edição não persiste e o usuário é avisado. */
  function safeSet(key, value){
    try{ localStorage.setItem(key, value); return true; }
    catch(e){ alert('Não foi possível salvar neste navegador (armazenamento bloqueado ou cheio). Saia do modo de navegação privada e tente de novo.'); return false; }
  }
  function saveOverride(recId, patch){
    var all = loadOverrides();
    all[recId] = patch;
    return safeSet(OVERRIDES_KEY, JSON.stringify(all));
  }
  (function applyOverrides(){
    var all = loadOverrides();
    RECORDS.forEach(function(rec){
      var patch = all[rec.id];
      if (!patch) return;
      if (patch.professor !== undefined) rec.professor = patch.professor;
      if (patch.sala !== undefined) rec.sala = patch.sala;
      if (patch.vagas !== undefined) rec.vagas = patch.vagas;
      if (patch.section) rec.section = patch.section;
      if (patch.sessions) rec.sessions = patch.sessions;
      if (patch.curr2008) rec.curr2008 = patch.curr2008;
      if (patch.curr2023) rec.curr2023 = patch.curr2023;
      rec._overridden = true;
    });
  })();

  /* ============================================================
     AUDITORIA — histórico de alterações (global, cruza todos os cursos,
     porque um coordenador acompanha o painel como um todo).
     ============================================================ */
  var AUDIT_KEY = 'bussola_audit';
  var AUDIT_MAX = 500;
  function loadAudit(){
    try{ return JSON.parse(localStorage.getItem(AUDIT_KEY)) || []; }catch(e){ return []; }
  }
  /* entry: { curso, cursoNome, tipo, turmaSigla, turmaNome, motivo, antes, depois } —
     id/ts/autor/autorRole são preenchidos aqui para nunca ficarem inconsistentes. */
  function logAudit(entry){
    var all = loadAudit();
    all.unshift(Object.assign({
      id: Date.now() + '-' + Math.floor(Math.random()*1000),
      ts: Date.now(),
      autor: (SESSION && SESSION.nome) || 'desconhecido',
      autorRole: (SESSION && SESSION.role) || '—'
    }, entry));
    if (all.length > AUDIT_MAX) all.length = AUDIT_MAX;
    safeSet(AUDIT_KEY, JSON.stringify(all));
  }
  
  var DAY_ORDER = [1,2,3,4,5,6]; // Mon..Sat
  var DAY_SHORT = {1:'SEG',2:'TER',3:'QUA',4:'QUI',5:'SEX',6:'SÁB'};
  var DAY_FULL  = {1:'Segunda-feira',2:'Terça-feira',3:'Quarta-feira',4:'Quinta-feira',5:'Sexta-feira',6:'Sábado'};
  /* Duração real de cada registro de horário: no BSI cada sessão é um bloco de 2h
     (14 = 14h–16h); nos demais cursos a planilha traz uma linha por hora-aula
     (16 e 17 = duas aulas seguidas de 1h). Tudo que mostra "início–fim" ou testa
     "acontecendo agora" usa SLOT, nunca um "+2" fixo. */
  var SLOT = (CURSO === 'bsi') ? 2 : 1;
  var HOURS = [8,14,16,18,20];
  (function buildHours(){
    var hs = []; RECORDS.forEach(function(r){ r.sessions.forEach(function(s){ hs.push(s.hour); }); });
    if (CURSO !== 'bsi'){
      if (hs.length){ HOURS = []; for (var hh = Math.min.apply(null,hs); hh <= Math.max.apply(null,hs); hh++) HOURS.push(hh); }
    } else {
      /* BSI: grade-base + qualquer horário novo trazido por CSV/ajuste excepcional,
         para que nenhuma aula fique invisível na grade */
      hs.forEach(function(h){ if (HOURS.indexOf(h) === -1) HOURS.push(h); });
      HOURS.sort(function(a,b){ return a-b; });
    }
  })();
  
  /* Building / floor model — mantido só como origem da lista de salas
     físicas usada pela aba "Salas"; hoje o painel mostra ocupação em
     cards, não um modelo 3D. */
     var BUILDINGS = [
      {
        id: 'principal', name: 'Prédio Principal do CCET', attached:false,
        wings: [ { id:'antiga', label:'Ala Antiga', share:0.44 }, { id:'nova', label:'Ala Nova', share:0.56 } ],
        floors: [
          { id:'terreo', label:'Térreo', sub:'Acesso e laboratórios', rooms:['Lab. 1','Lab. 2','Lab. 3','Lab. SAN'] },
          { id:'and1',   label:'1º Andar', sub:'Salas 1xx', rooms:['Sala 105'] },
          { id:'and2',   label:'2º Andar', sub:'Salas 2xx', rooms:['Sala 212','Sala 215'] },
          { id:'and3',   label:'3º Andar', sub:'Sem dados nesta grade', rooms:[] },
          { id:'and4',   label:'4º Andar', sub:'Sem dados nesta grade', rooms:[] }
        ]
      },
      {
        id: 'anexo', name: 'Prédio Anexo', attached:true,
        floors: [
          { id:'anexo-terreo', label:'Térreo do Anexo', sub:'Salas de pós-graduação (PPGI)', rooms:['Anexo 1'] },
          { id:'anexo-1',      label:'1º Andar do Anexo', sub:'Laboratórios de pesquisa (PPGI)', rooms:['Anexo 2'] }
        ]
      }
    ];
  
  /* para os cursos de escopo (IBIO/Eng), as salas de exemplo não estão no
     mapeamento acima — a lista de salas físicas passa a vir direto dos
     próprios registros nesse caso, em vez do mapeamento fixo do CCET */
  var ALL_ROOMS = [];
  if (CURSO === 'bsi'){
    BUILDINGS.forEach(function(b){ b.floors.forEach(function(f){ f.rooms.forEach(function(r){ ALL_ROOMS.push(r); }); }); });
  } else {
    var seenRooms = {};
    RECORDS.forEach(function(r){ if (r.sala && !seenRooms[r.sala]){ seenRooms[r.sala]=1; ALL_ROOMS.push(r.sala); } });
  }
  
  if (window.BussolaStore) BussolaStore.mergeRooms(CURSO, ALL_ROOMS);
  
  function roomBuildingFloor(room){
    for (var bi=0; bi<BUILDINGS.length; bi++){
      var b = BUILDINGS[bi];
      for (var fi=0; fi<b.floors.length; fi++){
        if (b.floors[fi].rooms.indexOf(room) !== -1) return {building:b, floor:b.floors[fi]};
      }
    }
    return null;
  }
  
  /* ============================================================
     SESSION / ROLE
     ============================================================ */
  var SESSION = (window.BussolaAuth && window.BussolaAuth.getSession()) || null;
  var IS_PROFESSOR = !!(SESSION && SESSION.role === 'professor');
  
  /* ============================================================
     STATE
     ============================================================ */
  var state = {
    tab: 'predio',
    grade: '2023',           // '2023' | '2008'
    predio: null,             // { day, hour } — set lazily on first render of the "Salas" tab
    filters: {
      grade: { sala:'', professor:'', dia:'', turno:'', q:'' },
      disc:  { grade:'', periodo:'', secao:'', q:'' }
    },
    sort: { key:'periodo', dir:1 },
    mobileDay: null            // dia exibido na grade horária em telas estreitas
  };
  
  /* ============================================================
     HELPERS
     ============================================================ */
  function el(tag, attrs, children){
    var e = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs){
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (children||[]).forEach(function(c){ if (c!=null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  /* Marca cada <td> com o nome da sua coluna (data-label) para o CSS poder
     empilhar a tabela em "cartões" no celular, sem rolagem lateral. */
  function mobileTable(table){
    if (!table) return;
    var heads = Array.prototype.map.call(table.querySelectorAll('thead th'), function(th){ return th.textContent.replace(/[↕]/g,'').trim(); });
    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function(tr){
      Array.prototype.forEach.call(tr.children, function(td, i){ if (!td.hasAttribute('colspan') && heads[i]) td.setAttribute('data-label', heads[i]); });
    });
    table.classList.add('stack-m');
  }
  function fmtHour(h){ return (h<10?'0':'')+h+':00'; }
  function fmtRange(h){ return fmtHour(h)+'–'+fmtHour(h+SLOT); }
  /* mesmo que dois horários se sobreponham parcialmente (ex.: 15h dentro de um bloco 14h–16h) */
  function overlaps(h1, h2){ return h1 < h2 + SLOT && h2 < h1 + SLOT; }
  function profShort(p){ return p ? p.replace(/^Prof[ªa\.]*\s*/i,'').trim() : ''; }
  
  function nowInfo(){
    var d = new Date();
    var jsDay = d.getDay(); // 0 Sun..6 Sat
    var ourDay = jsDay === 0 ? 7 : jsDay; // 1..7, we only use 1..6
    return { day: ourDay, hour: d.getHours(), minute: d.getMinutes(), date: d };
  }
  
  /* status of a session relative to now: 'now' | 'soon' (later today) | 'free' */
  function sessionStatus(sessions, today, hour){
    var isNow = false, isSoonToday = false;
    sessions.forEach(function(s){
      if (s.day_num === today){
        if (hour >= s.hour && hour < s.hour + SLOT) isNow = true;
        else if (s.hour > hour) isSoonToday = true;
      }
    });
    if (isNow) return 'now';
    if (isSoonToday) return 'soon';
    return 'free';
  }
  
  function roomStatusToday(room){
    var info = nowInfo();
    var worst = 'free';
    RECORDS.forEach(function(r){
      if (r.sala !== room) return;
      var st = sessionStatus(r.sessions, info.day, info.hour);
      if (st === 'now') worst = 'now';
      else if (st === 'soon' && worst !== 'now') worst = 'soon';
    });
    return worst;
  }
  
  function subjectLabel(rec, gradePref){
    // returns {sigla, nome, periodo, grade} chosen according to gradePref ('2023'|'2008')
    var g = gradePref;
    if (g === '2023' && rec.curr2023) return {sigla:rec.curr2023.sigla, nome:rec.curr2023.nome, periodo:rec.curr2023.periodo, grade:'2023'};
    if (g === '2008' && rec.curr2008) return {sigla:rec.curr2008.sigla, nome:rec.curr2008.nome, periodo:rec.curr2008.periodo, grade:'2008'};
    // fallback to whichever exists (cobre o caso de uma disciplina que só existe numa das grades)
    if (rec.curr2023) return {sigla:rec.curr2023.sigla, nome:rec.curr2023.nome, periodo:rec.curr2023.periodo, grade:'2023'};
    if (rec.curr2008) return {sigla:rec.curr2008.sigla, nome:rec.curr2008.nome, periodo:rec.curr2008.periodo, grade:'2008'};
    return {sigla:'—', nome:'—', periodo:'', grade:'2023'};
  }
  
  /* flattened list: one row per (record, curriculum-side present) — used by Disciplinas index */
  function flattenSubjects(){
    var out = [];
    RECORDS.forEach(function(rec){
      if (rec.curr2008) out.push({ rec:rec, grade:'2008', sigla:rec.curr2008.sigla, nome:rec.curr2008.nome, codigo:rec.curr2008.codigo, periodo:rec.curr2008.periodo, ppgi: !!rec.curr2008.ppgi });
      if (rec.curr2023) out.push({ rec:rec, grade:'2023', sigla:rec.curr2023.sigla, nome:rec.curr2023.nome, codigo:rec.curr2023.codigo, periodo:rec.curr2023.periodo, ppgi: !!rec.curr2023.ppgi });
    });
    return out;
  }
  
  window.__BUSSOLA__ = { SLOT:SLOT, RECORDS:RECORDS, BUILDINGS:BUILDINGS, state:state, CURSO:CURSO, COURSE:COURSE, PICK_GROUP:PICK_GROUP, SESSION:SESSION, IS_PROFESSOR:IS_PROFESSOR };
  
  /* export shared refs for later script chunks */
  window.__b_helpers = { mobileTable:mobileTable, SLOT:SLOT, fmtRange:fmtRange, overlaps:overlaps, safeSet:safeSet, el:el, fmtHour:fmtHour, profShort:profShort, nowInfo:nowInfo, sessionStatus:sessionStatus,
    roomStatusToday:roomStatusToday, subjectLabel:subjectLabel, flattenSubjects:flattenSubjects,
    roomBuildingFloor:roomBuildingFloor, ALL_ROOMS:ALL_ROOMS, DAY_ORDER:DAY_ORDER, DAY_SHORT:DAY_SHORT, DAY_FULL:DAY_FULL, HOURS:HOURS,
    saveOverride:saveOverride, logAudit:logAudit, getAudit:loadAudit };
  
  })();
  (function(){
  "use strict";
  var H = window.__b_helpers, RECORDS = window.__BUSSOLA__.RECORDS, BUILDINGS = window.__BUSSOLA__.BUILDINGS, state = window.__BUSSOLA__.state;
  var el = H.el;
  
  /* ============================================================
     TOOLTIP (used for sigla hover everywhere)
     ============================================================ */
  var tooltipEl = document.getElementById('tooltip');
  var ttTimer = null;
  /* Em telas de toque (iPhone/Android) não existe "passar o mouse": o toque já abre
     a gaveta de detalhes, então o tooltip fica restrito a dispositivos com hover. */
  var CAN_HOVER = !(window.matchMedia && window.matchMedia('(hover: none)').matches);
  function showTooltip(target, html){
    if (!CAN_HOVER) return;
    tooltipEl.innerHTML = html;
    var r = target.getBoundingClientRect();
    var tw = 260;
    var left = Math.min(Math.max(8, r.left + r.width/2 - tw/2), window.innerWidth - tw - 8);
    var top = r.top - 10;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = Math.max(8, top) + 'px';
    tooltipEl.style.transform = 'translateY(-100%)';
    requestAnimationFrame(function(){ tooltipEl.classList.add('show'); });
  }
  function hideTooltip(){ tooltipEl.classList.remove('show'); }
  function attachSiglaTooltip(node, rec, grade){
    node.addEventListener('mouseenter', function(){
      var c08 = rec.curr2008, c23 = rec.curr2023;
      var html = '';
      if (grade === '2023' && c23) html = '<b>'+c23.sigla+'</b> — '+c23.nome+(c08?'<div class="tt-sub">Grade 2008: '+c08.sigla+' · '+c08.nome+'</div>':'<div class="tt-sub">Sem correspondente na grade 2008</div>');
      else if (grade === '2008' && c08) html = '<b>'+c08.sigla+'</b> — '+c08.nome+(c23?'<div class="tt-sub">Grade 2023: '+c23.sigla+' · '+c23.nome+'</div>':'<div class="tt-sub">Fora de oferta na grade 2023</div>');
      else html = '<b>'+(c23?c23.sigla:c08.sigla)+'</b> — '+(c23?c23.nome:c08.nome);
      showTooltip(node, html);
    });
    node.addEventListener('mouseleave', hideTooltip);
  }
  
  /* generic sigla chip factory */
  function siglaChip(rec, gradePref){
    var lbl = H.subjectLabel(rec, gradePref);
    var chip = el('span', {class:'sigla-chip g'+lbl.grade}, [
      el('span', {class:'grade-dot g'+lbl.grade}), lbl.sigla
    ]);
    attachSiglaTooltip(chip, rec, lbl.grade);
    return chip;
  }
  
  /* ============================================================
     LIVE CLOCK + "AGORA" strip
     ============================================================ */
  function renderClock(){
    var info = H.nowInfo();
    var el2 = document.getElementById('liveClock');
    if (info.day > 6){
      el2.textContent = 'Domingo · sem aulas';
    } else {
      var hh = (info.hour<10?'0':'')+info.hour, mm = (info.minute<10?'0':'')+info.minute;
      el2.textContent = H.DAY_SHORT[info.day] + ' · ' + hh + ':' + mm;
    }
  }
  
  function renderNowList(){
    var info = H.nowInfo();
    var list = document.getElementById('nowList');
    list.innerHTML = '';
    var items = [];
    RECORDS.forEach(function(rec){
      rec.sessions.forEach(function(s){
        if (s.day_num === info.day && info.hour >= s.hour && info.hour < s.hour+H.SLOT){
          items.push({rec:rec, sess:s});
        }
      });
    });
    if (!items.length){
      list.appendChild(el('div', {class:'now-empty'}, ['Nenhuma aula agora. Confira a grade horária completa.']));
      return;
    }
    items.forEach(function(it){
      var lbl = H.subjectLabel(it.rec, state.grade);
      var row = el('div', {class:'now-row', role:'button', tabindex:'0', title:lbl.nome});
      row.addEventListener('click', function(){ UI.openDrawer(it.rec, 'busca'); });
      row.addEventListener('keydown', function(e){ if (e.key==='Enter' || e.key===' '){ e.preventDefault(); UI.openDrawer(it.rec, 'busca'); } });
      var chip = siglaChip(it.rec, state.grade);
      row.appendChild(chip);
      row.appendChild(el('span', {}, [H.profShort(it.rec.professor)]));
      row.appendChild(el('span', {class:'rm'}, [it.rec.sala || '—']));
      list.appendChild(row);
    });
  }
  
  /* ============================================================
     KPI ROW
     ============================================================ */
  var CURSO_KEY = window.__BUSSOLA__.CURSO;
  function computeKPIs(){
    var flat = H.flattenSubjects();
    var disciplinasAtuais = flat.filter(function(x){ return x.grade==='2023'; }).length;
    var disciplinasAntigas = flat.filter(function(x){ return x.grade==='2008'; }).length;
    var rooms = {}; RECORDS.forEach(function(r){ if (r.sala) rooms[r.sala]=1; });
    var profs = {}; RECORDS.forEach(function(r){ if (r.professor && r.professor.indexOf('orientadores')===-1) profs[r.professor]=1; });
    var totalSessions = 0; RECORDS.forEach(function(r){ totalSessions += r.sessions.length; });
    // busiest slot
    var slotCount = {};
    RECORDS.forEach(function(r){ r.sessions.forEach(function(s){ var k=s.day_num+'-'+s.hour; slotCount[k]=(slotCount[k]||0)+1; }); });
    var busiest = null, busiestN = 0;
    for (var k in slotCount){ if (slotCount[k] > busiestN){ busiestN = slotCount[k]; busiest = k; } }
    var busiestLabel = '—';
    if (busiest){ var parts = busiest.split('-'); busiestLabel = H.DAY_SHORT[parts[0]] + ' ' + H.fmtHour(parseInt(parts[1],10)); }
  
    return [
      { n: disciplinasAtuais, unit:'', lbl:'Disciplinas na grade 2023', sub: disciplinasAntigas+' ainda ativas na grade 2008' },
      { n: Object.keys(rooms).length, unit:'salas', lbl:'Espaços físicos em uso', sub: (CURSO_KEY === 'bsi' ? 'distribuídos em 2 prédios' : 'no catálogo de salas do curso') },
      { n: Object.keys(profs).length, unit:'docentes', lbl:'Professores responsáveis', sub:'no semestre 2026/2' },
      { n: totalSessions, unit:'aulas/sem.', lbl:'Sessões semanais', sub:'pico: '+busiestLabel }
    ];
  }
  function renderKPIs(){
    var row = document.getElementById('kpiRow');
    row.innerHTML = '';
    computeKPIs().forEach(function(k){
      row.appendChild(el('div', {class:'kpi'}, [
        el('div', {class:'n'}, [String(k.n), el('span', {class:'unit'}, [k.unit])]),
        el('div', {class:'lbl'}, [k.lbl]),
        el('div', {class:'sub'}, [k.sub])
      ]));
    });
  }
  
  /* ============================================================
     SVG BAR CHART (custom, dependency-free)
     ============================================================ */
  function svgEl(tag, attrs){
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function barChart(container, data, opts){
    // data: [{label, value, color}]
    opts = opts || {};
    var w = opts.width || 480, h = opts.height || 220;
    var padL = 30, padB = opts.rotateLabels ? 54 : 30, padT = 14, padR = 10;
    var innerW = w - padL - padR, innerH = h - padT - padB;
    var maxV = Math.max.apply(null, data.map(function(d){ return d.value; })) || 1;
    var svg = svgEl('svg', {viewBox:'0 0 '+w+' '+h, class:'bar-chart', role:'img', 'aria-label': opts.ariaLabel || 'gráfico de barras'});
    svg.style.minWidth = Math.max(280, data.length*34) + 'px';
    // gridlines
    var steps = 4;
    for (var i=0;i<=steps;i++){
      var y = padT + innerH - (innerH*i/steps);
      svg.appendChild(svgEl('line', {x1:padL, x2:w-padR, y1:y, y2:y, class:'grid-line'}));
      var lbl = svgEl('text', {x:4, y:y+3, class:'axis-label'}); lbl.textContent = Math.round(maxV*i/steps);
      svg.appendChild(lbl);
    }
    var bw = innerW / data.length;
    data.forEach(function(d, idx){
      var bh = maxV ? (d.value/maxV)*innerH : 0;
      var x = padL + idx*bw + bw*0.18;
      var barW = bw*0.64;
      var y = padT + innerH - bh;
      var rect = svgEl('rect', {x:x, y:y, width:barW, height:bh, rx:3, fill:d.color, class:'bar'});
      rect.appendChild(svgEl('title', {})).textContent = d.label + ': ' + d.value;
      svg.appendChild(rect);
      if (d.value>0){
        var vlab = svgEl('text', {x:x+barW/2, y:y-6, class:'val-label', 'text-anchor':'middle'});
        vlab.textContent = d.value;
        svg.appendChild(vlab);
      }
      var xlab;
      if (opts.rotateLabels){
        xlab = svgEl('text', {x:x+barW/2, y:h-padB+16, class:'axis-label', 'text-anchor':'end', transform:'rotate(-40 '+(x+barW/2)+' '+(h-padB+16)+')'});
      } else {
        xlab = svgEl('text', {x:x+barW/2, y:h-10, class:'axis-label', 'text-anchor':'middle'});
      }
      xlab.textContent = d.label;
      svg.appendChild(xlab);
    });
    container.innerHTML = '';
    container.appendChild(svg);
  }

  function stackedBarChart(container, groups, seriesKeys, colors, opts){
    // groups: [{label, values:{key:val}}]
    opts = opts || {};
    var w = opts.width || 980, h = opts.height || 190;
    var padL = 26, padB = 26, padT = 14, padR = 10;
    var innerW = w - padL - padR, innerH = h - padT - padB;
    var totals = groups.map(function(g){ return seriesKeys.reduce(function(s,k){ return s + (g.values[k]||0); }, 0); });
    var maxV = Math.max.apply(null, totals) || 1;
    var svg = svgEl('svg', {viewBox:'0 0 '+w+' '+h, class:'bar-chart', role:'img', 'aria-label': opts.ariaLabel||'gráfico'});
    svg.style.minWidth = Math.max(320, groups.length*46) + 'px';
    var steps = 4;
    for (var i=0;i<=steps;i++){
      var y = padT + innerH - (innerH*i/steps);
      svg.appendChild(svgEl('line', {x1:padL, x2:w-padR, y1:y, y2:y, class:'grid-line'}));
    }
    var bw = innerW / groups.length;
    groups.forEach(function(g, idx){
      var x = padL + idx*bw + bw*0.16;
      var barW = bw*0.68;
      var yCursor = padT + innerH;
      var total = totals[idx];
      seriesKeys.forEach(function(k, si){
        var v = g.values[k] || 0;
        var bh = maxV ? (v/maxV)*innerH : 0;
        var y = yCursor - bh;
        if (v>0){
          var rect = svgEl('rect', {x:x, y:y, width:barW, height:bh, fill:colors[si]});
          rect.appendChild(svgEl('title', {})).textContent = g.label+' · '+k+': '+v;
          svg.appendChild(rect);
        }
        yCursor = y;
      });
      if (total>0){
        var vlab = svgEl('text', {x:x+barW/2, y:yCursor-6, class:'val-label', 'text-anchor':'middle'});
        vlab.textContent = total;
        svg.appendChild(vlab);
      }
      var xlab = svgEl('text', {x:x+barW/2, y:h-8, class:'axis-label', 'text-anchor':'middle'});
      xlab.textContent = g.label;
      svg.appendChild(xlab);
    });
    container.innerHTML = '';
    container.appendChild(svg);
  }
  
  function renderCharts(){
    // aulas por dia
    var dayCount = {1:0,2:0,3:0,4:0,5:0,6:0};
    RECORDS.forEach(function(r){ r.sessions.forEach(function(s){ if (dayCount[s.day_num]!==undefined) dayCount[s.day_num]++; }); });
    barChart(document.getElementById('chartDias'), H.DAY_ORDER.map(function(d){ return {label:H.DAY_SHORT[d], value:dayCount[d], color:'#3D8577'}; }), {width:520, height:210, ariaLabel:'Aulas por dia da semana'});
  
    // ocupação por sala
    var roomCount = {};
    H.ALL_ROOMS.forEach(function(r){ roomCount[r]=0; });
    RECORDS.forEach(function(r){ if (r.sala && roomCount[r.sala]!==undefined) roomCount[r.sala]+= r.sessions.length; });
    var roomData = Object.keys(roomCount).sort(function(a,b){ return roomCount[b]-roomCount[a]; }).map(function(r){ return {label:r.replace('Sala ','S.').replace('Lab. ','L.'), value:roomCount[r], color:'#B97A22'}; });
    barChart(document.getElementById('chartSalas'), roomData, {width:440, height:230, ariaLabel:'Ocupação por sala', rotateLabels:true});
  
    // disciplinas por periodo (stacked 2023 teal / 2008 plum)
    var periods = ['1','2','3','4','5','6','7','8','9','10','A','O'];
    var flat = H.flattenSubjects();
    var groups = periods.map(function(p){
      var v23 = flat.filter(function(x){ return x.grade==='2023' && x.periodo===p; }).length;
      var v08 = flat.filter(function(x){ return x.grade==='2008' && x.periodo===p; }).length;
      return { label:p, values:{ '2023':v23, '2008':v08 } };
    }).filter(function(g){ return g.values['2023']+g.values['2008'] > 0; });
    stackedBarChart(document.getElementById('chartPeriodos'), groups, ['2008','2023'], ['#7C5A72','#3D8577'], {width:1020, height:180, ariaLabel:'Disciplinas por período'});
  }
  
  window.__b_ui = window.__b_ui || {};
  window.__b_ui.siglaChip = siglaChip;
  window.__b_ui.attachSiglaTooltip = attachSiglaTooltip;
  window.__b_ui.showTooltip = showTooltip;
  window.__b_ui.hideTooltip = hideTooltip;
  window.__b_ui.renderClock = renderClock;
  window.__b_ui.renderNowList = renderNowList;
  window.__b_ui.renderKPIs = renderKPIs;
  window.__b_ui.renderCharts = renderCharts;
  window.__b_ui.barChart = barChart;
  
  })();
  (function(){
  "use strict";
  var H = window.__b_helpers, RECORDS = window.__BUSSOLA__.RECORDS, BUILDINGS = window.__BUSSOLA__.BUILDINGS, state = window.__BUSSOLA__.state;
  var el = H.el, UI = window.__b_ui;
  
  /* ============================================================
     PRÉDIO — room occupancy grid
     ============================================================
     One card per physical room (H.ALL_ROOMS). For the day + time slot
     chosen in the filter bar, each card shows whether the room is
     occupied (with the class allocated there, per the active grade)
     or free — same presentation model as the old prototype
     (nova_func.txt), rebuilt on top of the app's real dataset instead
     of a manual spreadsheet import. */
  
  function currentPredioSelection(){
    if (!state.predio){
      var info = H.nowInfo();
      var day = info.day <= 6 ? info.day : 1;
      var hour = H.HOURS.indexOf(info.hour) !== -1
        ? info.hour
        : H.HOURS.reduce(function(best,h){ return (h <= info.hour) ? h : best; }, H.HOURS[0]);
      state.predio = { day: day, hour: hour, status: 'todas' };
    }
    if (state.predio.status === undefined) state.predio.status = 'todas';
    return state.predio;
  }
  
  function renderFilterBarPredio(){
    var wrap = document.getElementById('filterBarPredio');
    if (!wrap) return;
    wrap.innerHTML = '';
    var sel = currentPredioSelection();
  
    function field(labelText, node){ return el('div', {class:'filter-field'}, [el('label',{},[labelText]), node]); }
  
    var daySelect = el('select', {});
    H.DAY_ORDER.forEach(function(d){
      var opt = el('option', {value:String(d)}, [H.DAY_FULL[d]]);
      if (d === sel.day) opt.selected = true;
      daySelect.appendChild(opt);
    });
    daySelect.addEventListener('change', function(){ sel.day = parseInt(daySelect.value, 10); renderRoomsGrid(); });
  
    var hourSelect = el('select', {});
    H.HOURS.forEach(function(h){
      var opt = el('option', {value:String(h)}, [H.fmtHour(h)+' – '+H.fmtHour(h+H.SLOT)]);
      if (h === sel.hour) opt.selected = true;
      hourSelect.appendChild(opt);
    });
    hourSelect.addEventListener('change', function(){ sel.hour = parseInt(hourSelect.value, 10); renderRoomsGrid(); });
  
    var statusSelect = el('select', {});
    [['todas','Todas as salas'],['livres','Só livres'],['ocupadas','Só ocupadas']].forEach(function(o){
      var opt = el('option', {value:o[0]}, [o[1]]);
      if (o[0] === sel.status) opt.selected = true;
      statusSelect.appendChild(opt);
    });
    statusSelect.addEventListener('change', function(){ sel.status = statusSelect.value; renderRoomsGrid(); });

    wrap.appendChild(field('Dia', daySelect));
    wrap.appendChild(field('Horário', hourSelect));
    wrap.appendChild(field('Status', statusSelect));

    var nowBtn = el('button', {class:'filter-reset'}, ['Ver agora']);
    nowBtn.addEventListener('click', function(){
      var info = H.nowInfo();
      sel.day = info.day <= 6 ? info.day : 1;
      sel.hour = H.HOURS.indexOf(info.hour) !== -1
        ? info.hour
        : H.HOURS.reduce(function(best,h){ return (h <= info.hour) ? h : best; }, H.HOURS[0]);
      renderFilterBarPredio();
      renderRoomsGrid();
    });
    wrap.appendChild(nowBtn);
  }
  
  function roomOccupancyAt(room, day, hour){
    var found = null;
    RECORDS.some(function(rec){
      if (rec.sala !== room) return false;
      return rec.sessions.some(function(s){
        if (s.day_num === day && H.overlaps(s.hour, hour)){ found = rec; return true; }
        return false;
      });
    });
    return found;
  }
  
  function renderRoomsGrid(){
    var grid = document.getElementById('roomsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var sel = currentPredioSelection();
  
    H.ALL_ROOMS.forEach(function(room){
      var rec = roomOccupancyAt(room, sel.day, sel.hour);
      if (sel.status === 'livres' && rec) return;
      if (sel.status === 'ocupadas' && !rec) return;
      var card = el('div', {class:'room-card '+(rec ? 'occupied' : 'free'), 'data-room': room});
  
      card.appendChild(el('div', {class:'room-header'}, [
        el('span', {class:'room-title'}, [room]),
        el('span', {class:'status-badge'}, [rec ? 'Ocupada' : 'Livre'])
      ]));
  
      if (rec){
        var lbl = H.subjectLabel(rec, state.grade);
        var codigo = lbl.grade === '2023' ? (rec.curr2023 && rec.curr2023.codigo) : (rec.curr2008 && rec.curr2008.codigo);
        var abbr = el('span', {class:'subject-abbr g'+lbl.grade}, [lbl.sigla]);
        UI.attachSiglaTooltip(abbr, rec, lbl.grade);
        var tags = el('div', {class:'tags-container'}, [
          abbr,
          codigo ? el('span', {class:'subject-code'}, [codigo]) : null
        ]);
        var details = el('div', {class:'class-details'}, [
          tags,
          el('div', {class:'subject-name'}, [lbl.nome]),
          el('div', {class:'info-group'}, [el('span', {class:'info-label'}, ['Professor(a): ']), H.profShort(rec.professor)])
        ]);
        card.appendChild(details);
        card.addEventListener('click', function(){ UI.openDrawer(rec, 'salas'); });
      } else {
        card.appendChild(el('div', {class:'free-message'}, ['Disponível']));
      }
  
      grid.appendChild(card);
    });
  }
  
  function highlightRoom(room){
    renderFilterBarPredio();
    renderRoomsGrid();
    requestAnimationFrame(function(){
      var card = document.querySelector('#roomsGrid [data-room="'+room+'"]');
      if (!card) return;
      card.scrollIntoView({behavior:'smooth', block:'center'});
      card.classList.add('flash');
      setTimeout(function(){ card.classList.remove('flash'); }, 1600);
    });
  }
  
  window.__b_ui.renderFilterBarPredio = renderFilterBarPredio;
  window.__b_ui.renderRoomsGrid = renderRoomsGrid;
  window.__b_ui.highlightRoom = highlightRoom;
  
  })();
  (function(){
  "use strict";
  var H = window.__b_helpers, RECORDS = window.__BUSSOLA__.RECORDS, BUILDINGS = window.__BUSSOLA__.BUILDINGS, state = window.__BUSSOLA__.state;
  var el = H.el, UI = window.__b_ui;
  var IS_PROFESSOR = window.__BUSSOLA__.IS_PROFESSOR, SESSION = window.__BUSSOLA__.SESSION, COURSE = window.__BUSSOLA__.COURSE, CURSO = window.__BUSSOLA__.CURSO, PICK_GROUP = window.__BUSSOLA__.PICK_GROUP;
  
  /* ============================================================
     DRAWER (subject / class detail)
     ============================================================ */
  var drawerEl = document.getElementById('drawer');
  var backdropEl = document.getElementById('drawerBackdrop');
  
  /* Busca a ementa oficial pelo código da disciplina (currículo 2023 tem
     prioridade; cai para o código 2008 quando só existir naquela grade). */
  function findEmenta(rec){
    var mapa = window.BSI_EMENTAS || {};
    var cods = [];
    if (rec.curr2023 && rec.curr2023.codigo) cods.push(rec.curr2023.codigo);
    if (rec.curr2008 && rec.curr2008.codigo) cods.push(rec.curr2008.codigo);
    for (var i=0; i<cods.length; i++){
      if (mapa[cods[i]]) return { codigo: cods[i], data: mapa[cods[i]] };
    }
    return null;
  }
  
  /* origem: 'grade' | 'disciplinas' | 'busca' | 'salas'
     A ementa só aparece quando o drawer é aberto pela grade horária ou
     pelo índice de disciplinas — não na busca nem na aba de ocupação. */
  function openDrawer(rec, origem){
    var mostrarEmenta = (origem === 'grade' || origem === 'disciplinas');
    var lbl = H.subjectLabel(rec, state.grade);
    document.getElementById('drawerSigla').innerHTML = '';
    document.getElementById('drawerSigla').appendChild(UI.siglaChip(rec, state.grade));
    if (rec._overridden) document.getElementById('drawerSigla').appendChild(el('span', {class:'overridden-badge'}, ['editado']));
    document.getElementById('drawerTitle').textContent = lbl.nome;
  
    var body = document.getElementById('drawerBody');
    body.innerHTML = '';
  
    var corr = el('div', {class:'drawer-corr'});
    corr.appendChild(
      rec.curr2023
        ? el('div', {class:'dc-box g2023'}, [el('div',{class:'dc-lbl'},['GRADE 2023 · ATUAL']), el('div',{class:'dc-sigla'},[rec.curr2023.sigla]), el('div',{class:'dc-nome'},[rec.curr2023.nome])])
        : el('div', {class:'dc-box empty'}, ['Sem equivalente na grade 2023'])
    );
    corr.appendChild(
      rec.curr2008
        ? el('div', {class:'dc-box g2008'}, [el('div',{class:'dc-lbl'},['GRADE 2008 · ANTIGA']), el('div',{class:'dc-sigla'},[rec.curr2008.sigla]), el('div',{class:'dc-nome'},[rec.curr2008.nome])])
        : el('div', {class:'dc-box empty'}, ['Sem equivalente na grade 2008'])
    );
    body.appendChild(corr);

    body.appendChild(el('h5', {}, ['DETALHES DA TURMA']));
    function row(k,v){ return el('div', {class:'db-row'}, [el('span',{class:'k'},[k]), el('span',{class:'v'},[v||'—'])]); }
    body.appendChild(row('Professor(a)', rec.professor));
    body.appendChild(row('Sala', rec.sala || 'sem sala fixa'));
    body.appendChild(row('Vagas', rec.vagas ? String(rec.vagas) : '—'));
    body.appendChild(row('Código 2023', rec.curr2023 ? rec.curr2023.codigo : '—'));
    body.appendChild(row('Código 2008', rec.curr2008 ? rec.curr2008.codigo : '—'));
    body.appendChild(row('Tipo', rec.section==='pos' ? 'Optativa / Pós-graduação (PPGI)' : 'Componente regular'));
  
    body.appendChild(el('h5', {}, ['HORÁRIOS SEMANAIS']));
    if (!rec.sessions.length){
      body.appendChild(el('div', {class:'rd-empty'}, ['Sem horário fixo (orientação / atividade contínua).']));
    }
    rec.sessions.forEach(function(s){
      body.appendChild(el('div', {class:'rd-slot', style:'margin-bottom:7px;'}, [
        el('span', {class:'day'}, [H.DAY_SHORT[s.day_num]]),
        el('span', {class:'hr'}, [H.fmtRange(s.hour)]),
        el('span', {class:'subj'}, [rec.sala || 'sem sala'])
      ]));
    });
  
    if (mostrarEmenta){
      var em = findEmenta(rec);
      body.appendChild(el('h5', {}, ['EMENTA']));
      if (em){
        body.appendChild(el('div', {class:'ementa-box'}, [
          el('div', {class:'ementa-meta'}, [em.codigo + ' · ' + em.data.nome]),
          el('p', {class:'ementa-texto'}, [em.data.ementa])
        ]));
        body.appendChild(el('div', {class:'ementa-fonte'}, ['Fonte: Portal do Ementário — UNIRIO']));
      } else if (rec.ementa_url){
        body.appendChild(el('a', {class:'ementa-fonte', href:rec.ementa_url, target:'_blank', rel:'noopener'}, ['Ver ementa no Portal do Ementário — UNIRIO']));
      } else {
        body.appendChild(el('div', {class:'rd-empty'}, ['Ementa não disponível no ementário para esta disciplina.']));
      }
    }
  
    drawerEl.classList.add('open');
    backdropEl.classList.add('open');
  }
  
  function closeDrawer(){ drawerEl.classList.remove('open'); backdropEl.classList.remove('open'); }
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  backdropEl.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function(e){ if (e.key==='Escape') closeDrawer(); });
  
  /* ============================================================
     GRADE HORÁRIA — weekly board
     ============================================================ */
  function uniqueSorted(arr){ return Array.from(new Set(arr)).sort(function(a,b){ return String(a).localeCompare(String(b),'pt-BR'); }); }
  
  function renderFilterBarGrade(){
    var wrap = document.getElementById('filterBarGrade');
    wrap.innerHTML = '';
    var f = state.filters.grade;
  
    var rooms = uniqueSorted(RECORDS.map(function(r){ return r.sala; }).filter(Boolean));
    var profs = uniqueSorted(RECORDS.map(function(r){ return r.professor; }).filter(Boolean));
  
    function field(labelText, selectEl){
      return el('div', {class:'filter-field'}, [el('label',{},[labelText]), selectEl]);
    }
    function makeSelect(options, value, onChange, placeholder){
      var s = el('select', {});
      s.appendChild(el('option', {value:''}, [placeholder]));
      options.forEach(function(o){ var opt = el('option', {value:o}, [o]); if (o===value) opt.selected = true; s.appendChild(opt); });
      s.addEventListener('change', function(){ onChange(s.value); });
      return s;
    }
  
    wrap.appendChild(field('Sala', makeSelect(rooms, f.sala, function(v){ f.sala=v; renderSchedule(); }, 'Todas as salas')));
    wrap.appendChild(field('Professor', makeSelect(profs, f.professor, function(v){ f.professor=v; renderSchedule(); }, 'Todos os professores')));
    wrap.appendChild(field('Turno', makeSelect(['Tarde (14–18h)','Noite (18–22h)','Manhã (8–10h)'], f.turno, function(v){ f.turno=v; renderSchedule(); }, 'Todos os turnos')));
  
    var searchField = el('div', {class:'filter-field'}, [
      el('label', {}, ['Buscar']),
      (function(){
        var inp = el('input', {type:'text', placeholder:'sigla, disciplina, sala…', value:f.q});
        inp.addEventListener('input', function(){ f.q = inp.value; renderSchedule(); });
        return inp;
      })()
    ]);
    wrap.appendChild(searchField);
  
    var reset = el('button', {class:'filter-reset'}, ['Limpar filtros']);
    reset.addEventListener('click', function(){ state.filters.grade = {sala:'',professor:'',dia:'',turno:'',q:''}; renderFilterBarGrade(); renderSchedule(); });
    wrap.appendChild(reset);
  }
  
  function matchesGradeFilter(rec){
    var f = state.filters.grade;
    if (f.sala && rec.sala !== f.sala) return false;
    if (f.professor && rec.professor !== f.professor) return false;
    if (f.turno){
      var ok = rec.sessions.some(function(s){
        if (f.turno.indexOf('Tarde')===0) return s.hour>=13 && s.hour<18;
        if (f.turno.indexOf('Noite')===0) return s.hour>=18;
        if (f.turno.indexOf('Manhã')===0) return s.hour<13;
        return true;
      });
      if (!ok) return false;
    }
    if (f.q){
      var q = f.q.toLowerCase();
      var hay = [rec.professor, rec.sala, rec.curr2023&&rec.curr2023.sigla, rec.curr2023&&rec.curr2023.nome, rec.curr2008&&rec.curr2008.sigla, rec.curr2008&&rec.curr2008.nome].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }
  
  function currentMobileDay(){
    if (!state.mobileDay){ var info = H.nowInfo(); state.mobileDay = info.day <= 6 ? info.day : 1; }
    return state.mobileDay;
  }
  function renderDaySwitch(){
    var wrap = document.getElementById('daySwitch');
    if (!wrap) return;
    wrap.innerHTML = '';
    var cur = currentMobileDay(), today = H.nowInfo().day;
    H.DAY_ORDER.forEach(function(d){
      var b = el('button', {type:'button', class:'day-chip'+(d===cur?' on':''), 'aria-pressed':String(d===cur), 'aria-label':H.DAY_FULL[d]}, [H.DAY_SHORT[d]]);
      if (d === today) b.appendChild(el('i', {class:'day-dot', title:'hoje'}));
      b.addEventListener('click', function(){ state.mobileDay = d; renderSchedule(); });
      wrap.appendChild(b);
    });
  }

  function renderSchedule(){
    var grid = document.getElementById('scheduleGrid');
    grid.innerHTML = '';
    var info = H.nowInfo();
    var selDay = currentMobileDay();
    /* em telas estreitas o CSS mostra só a coluna do dia escolhido (data-sel-day) */
    grid.setAttribute('data-sel-day', String(selDay));
    renderDaySwitch();

    grid.appendChild(el('div', {class:'sb-head corner'}, ['Horário']));
    H.DAY_ORDER.forEach(function(d){
      var isToday = d === info.day;
      grid.appendChild(el('div', {class:'sb-head', 'data-day':String(d)}, [
        el('span', {class:'d-full'}, [H.DAY_FULL[d]]),
        isToday ? el('span', {class:'today-mark'}, ['HOJE']) : null
      ]));
    });

    var filtered = RECORDS.filter(matchesGradeFilter);
    var anyInSelDay = false;

    H.HOURS.forEach(function(hour){
      var rowCells = [];
      var hourCell = el('div', {class:'sb-cell hourcol'}, [H.fmtHour(hour)]);
      rowCells.push(hourCell);
      grid.appendChild(hourCell);
      var rowHasSel = false;
      H.DAY_ORDER.forEach(function(day){
        var cell = el('div', {class:'sb-cell', 'data-day':String(day)});
        filtered.forEach(function(rec){
          rec.sessions.forEach(function(s){
            if (s.day_num === day && s.hour === hour){
              if (day === selDay) rowHasSel = true;
              var lbl = H.subjectLabel(rec, state.grade);
              var isNow = day===info.day && info.hour>=hour && info.hour<hour+H.SLOT;
              var block = el('div', {class:'class-block grade'+lbl.grade+(isNow?' is-now':''), role:'button', tabindex:'0'}, [
                el('div', {class:'cb-title'}, [lbl.sigla]),
                el('div', {class:'cb-meta'}, [rec.sala||'sem sala', '· ', H.profShort(rec.professor)])
              ]);
              block.addEventListener('click', function(){ openDrawer(rec, 'grade'); });
              block.addEventListener('keydown', function(e){ if (e.key==='Enter' || e.key===' '){ e.preventDefault(); openDrawer(rec, 'grade'); } });
              block.addEventListener('mouseenter', function(){
                UI.showTooltip(block, '<b>'+lbl.nome+'</b><div class="tt-sub">'+H.profShort(rec.professor)+' · '+(rec.sala||'sem sala')+'</div>');
              });
              block.addEventListener('mouseleave', UI.hideTooltip);
              cell.appendChild(block);
            }
          });
        });
        rowCells.push(cell);
        grid.appendChild(cell);
      });
      if (rowHasSel) anyInSelDay = true;
      /* no celular, horários sem aula no dia escolhido somem para a lista ficar enxuta */
      if (!rowHasSel) rowCells.forEach(function(c){ c.classList.add('m-empty'); });
    });
    if (!anyInSelDay){
      grid.appendChild(el('div', {class:'sb-empty-m'}, ['Nenhuma aula em '+H.DAY_FULL[selDay]+' com os filtros atuais.']));
    }
  }
  
  /* ============================================================
     DISCIPLINAS — index table
     ============================================================ */
  function renderFilterBarDisc(){
    var wrap = document.getElementById('filterBarDisc');
    wrap.innerHTML = '';
    var f = state.filters.disc;
    function field(labelText, node){ return el('div', {class:'filter-field'}, [el('label',{},[labelText]), node]); }
    function makeSelect(options, value, onChange, placeholder){
      var s = el('select', {});
      s.appendChild(el('option', {value:''}, [placeholder]));
      options.forEach(function(o){ var opt = el('option', {value:o.v}, [o.t]); if (o.v===value) opt.selected = true; s.appendChild(opt); });
      s.addEventListener('change', function(){ onChange(s.value); });
      return s;
    }
    wrap.appendChild(field('Grade', makeSelect([{v:'2023',t:'2023 — atual'},{v:'2008',t:'2008 — antiga'}], f.grade, function(v){ f.grade=v; renderDiscTable(); }, 'Ambas as grades')));
    wrap.appendChild(field('Período', makeSelect(['1','2','3','4','5','6','7','8','9','10','A','O'].map(function(p){return {v:p,t:p==='A'?'A — atividades':(p==='O'?'O — optativas':'Período '+p)};}), f.periodo, function(v){ f.periodo=v; renderDiscTable(); }, 'Todos os períodos')));
    wrap.appendChild(field('Seção', makeSelect([{v:'regular',t:'Regular'},{v:'pos',t:'Optativa / Pós (PPGI)'}], f.secao, function(v){ f.secao=v; renderDiscTable(); }, 'Todas')));
    var searchField = el('div', {class:'filter-field'}, [
      el('label', {}, ['Buscar']),
      (function(){
        var inp = el('input', {type:'text', placeholder:'sigla, nome, professor…', value:f.q});
        inp.addEventListener('input', function(){ f.q = inp.value; renderDiscTable(); });
        return inp;
      })()
    ]);
    wrap.appendChild(searchField);
    var reset = el('button', {class:'filter-reset'}, ['Limpar filtros']);
    reset.addEventListener('click', function(){ state.filters.disc = {grade:'',periodo:'',secao:'',q:''}; renderFilterBarDisc(); renderDiscTable(); });
    wrap.appendChild(reset);
    /* a tabela vira lista de cartões no celular (sem cabeçalho clicável) — este seletor assume a ordenação */
    var sortSel = el('select', {});
    [['periodo','Período'],['sigla','Sigla'],['nome','Disciplina'],['professor','Professor'],['sala','Sala']].forEach(function(o){
      var op = el('option', {value:o[0]}, [o[1]]); if (state.sort.key === o[0]) op.selected = true; sortSel.appendChild(op);
    });
    sortSel.addEventListener('change', function(){ state.sort.key = sortSel.value; state.sort.dir = 1; renderDiscTable(); });
    wrap.appendChild(el('div', {class:'filter-field only-mobile'}, [el('label',{},['Ordenar por']), sortSel]));
    wrap.appendChild(el('div', {class:'filter-count', id:'discCount'}, ['']));
  }
  
  function renderDiscTable(){
    var tbody = document.getElementById('discTbody');
    tbody.innerHTML = '';
    var flat = H.flattenSubjects();
    var f = state.filters.disc;
    flat = flat.filter(function(x){
      if (f.grade && x.grade !== f.grade) return false;
      if (f.periodo && x.periodo !== f.periodo) return false;
      if (f.secao && x.rec.section !== f.secao) return false;
      if (f.q){
        var q = f.q.toLowerCase();
        var hay = [x.sigla, x.nome, x.rec.professor, x.rec.sala].filter(Boolean).join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  
    var s = state.sort;
    var keyFn = {
      sigla: function(x){ return x.sigla; },
      nome: function(x){ return x.nome; },
      grade: function(x){ return x.grade; },
      periodo: function(x){ return x.periodo; },
      professor: function(x){ return x.rec.professor||''; },
      sala: function(x){ return x.rec.sala||''; }
    }[s.key] || function(x){ return x.periodo; };
    flat.sort(function(a,b){ return String(keyFn(a)).localeCompare(String(keyFn(b)), 'pt-BR', {numeric:true}) * s.dir; });
  
    document.getElementById('discCount') && (document.getElementById('discCount').textContent = flat.length + ' disciplina'+(flat.length!==1?'s':''));
  
    if (!flat.length){
      var tr = el('tr'); var td = el('td', {colspan:'7'});
      td.appendChild(el('div', {class:'empty-state'}, ['Nenhuma disciplina encontrada com esses filtros.']));
      tr.appendChild(td); tbody.appendChild(tr);
      return;
    }
  
    flat.forEach(function(x){
      var rec = x.rec;
      var tr = el('tr');
      var siglaChip = el('span', {class:'sigla-chip g'+x.grade}, [el('span',{class:'grade-dot g'+x.grade}), x.sigla]);
      UI.attachSiglaTooltip(siglaChip, rec, x.grade);
      tr.appendChild(el('td', {}, [siglaChip]));
      tr.appendChild(el('td', {class:'nome-cell'}, [el('span',{class:'nm'},[x.nome])]));
      tr.appendChild(el('td', {}, [x.grade==='2023' ? 'Atual' : 'Antiga']));
      tr.appendChild(el('td', {}, [el('span',{class:'sec-tag'},[x.periodo ? x.periodo + (x.rec.section==='pos'?' · pós':'') : '—'])]));
      tr.appendChild(el('td', {}, [H.profShort(rec.professor)]));
      tr.appendChild(el('td', {}, [rec.sala || '—']));
      tr.appendChild(el('td', {}, [rec.sessions.map(function(s){ return H.DAY_SHORT[s.day_num]+' '+H.fmtHour(s.hour); }).join(' · ') || '—']));
      tr.addEventListener('click', function(){ openDrawer(rec, 'disciplinas'); });
      tbody.appendChild(tr);
    });
    H.mobileTable(document.getElementById('discTable'));
  }
  
  document.querySelectorAll('#discTable thead th[data-sort]').forEach(function(th){
    th.addEventListener('click', function(){
      var k = th.getAttribute('data-sort');
      if (state.sort.key === k) state.sort.dir *= -1; else { state.sort.key = k; state.sort.dir = 1; }
      document.querySelectorAll('#discTable thead th').forEach(function(t){ t.classList.remove('sorted'); });
      th.classList.add('sorted');
      renderDiscTable();
    });
  });
  
  /* ============================================================
     GLOBAL SEARCH (header + hero)
     ============================================================ */
  /* Identifica POR QUE o registro deu match (professor, sala, sigla/código ou
     disciplina) para poder destacar o campo certo e mostrar o contexto mais
     relevante para cada tipo de busca — em vez de um resumo genérico igual
     para tudo. */
  function searchRecords(q){
    q = q.toLowerCase().trim();
    if (!q) return [];
    var out = [];
    RECORDS.forEach(function(rec){
      var prof = (rec.professor||'').toLowerCase();
      var sala = (rec.sala||'').toLowerCase();
      var c23 = rec.curr2023||{}, c08 = rec.curr2008||{};
      var sigla = [c23.sigla, c08.sigla].filter(Boolean).join(' ').toLowerCase();
      var codigo = [c23.codigo, c08.codigo].filter(Boolean).join(' ').toLowerCase();
      var nome = [c23.nome, c08.nome].filter(Boolean).join(' ').toLowerCase();
      var type = null;
      if (prof.indexOf(q) !== -1) type = 'professor';
      else if (sala.indexOf(q) !== -1) type = 'sala';
      else if (sigla.indexOf(q) !== -1 || codigo.indexOf(q) !== -1) type = 'sigla';
      else if (nome.indexOf(q) !== -1) type = 'disciplina';
      if (type) out.push({ rec:rec, type:type });
    });
    return out.slice(0,8);
  }
  function wireSearch(input, results){
    if (!input || !results) return;
    function horariosTxt(rec){
      return rec.sessions.length ? rec.sessions.map(function(s){ return s.day_short+' '+H.fmtHour(s.hour); }).join(', ') : 'sem horário fixo';
    }
    /* monta a linha secundária com o campo que casou com a busca em destaque,
       seguido do que mais ajuda a identificar o registro para aquele tipo de busca */
    function buildMeta(m){
      var rec = m.rec, c23 = rec.curr2023, c08 = rec.curr2008;
      var sigla = (c23 && c23.sigla) || (c08 && c08.sigla) || '—';
      var segs;
      if (m.type === 'professor') segs = [{t: rec.professor || '—', hl:true}, {t: horariosTxt(rec)}, {t: rec.sala || 'sem sala'}];
      else if (m.type === 'sala') segs = [{t: 'Sala ' + (rec.sala || '—'), hl:true}, {t: rec.professor || 'professor não informado'}, {t: horariosTxt(rec)}];
      else if (m.type === 'sigla') segs = [{t: sigla, hl:true}, {t: rec.professor || 'professor não informado'}, {t: horariosTxt(rec)}];
      else segs = [{t: rec.professor || 'professor não informado'}, {t: horariosTxt(rec)}, {t: rec.sala || 'sem sala'}];
      segs.push({t: COURSE.sigla});
      var nodes = [];
      segs.forEach(function(s, i){
        if (i) nodes.push(' · ');
        nodes.push(s.hl ? el('b', {}, [s.t]) : s.t);
      });
      return nodes;
    }
    input.addEventListener('input', function(){
      var matches = searchRecords(input.value);
      results.innerHTML = '';
      if (!matches.length){
        if (input.value.trim().length >= 2) {
          results.appendChild(el('div', {class:'hsr-empty'}, ['Nenhum resultado para "' + input.value.trim() + '" neste curso.']));
          results.classList.add('open');
        } else {
          results.classList.remove('open');
        }
        return;
      }
      matches.forEach(function(m){
        var rec = m.rec, lbl = H.subjectLabel(rec, state.grade);
        var item = el('div', {class:'hsr-item'}, [
          el('span', {class:'sigla-chip g'+lbl.grade}, [el('span',{class:'grade-dot g'+lbl.grade}), lbl.sigla]),
          el('div', {class:'hsr-info'}, [
            el('span', {class:'nm'}, [lbl.nome]),
            el('span', {class:'meta'}, buildMeta(m))
          ])
        ]);
        item.addEventListener('click', function(){ results.classList.remove('open'); input.value=''; openDrawer(rec, 'busca'); });
        results.appendChild(item);
      });
      results.classList.add('open');
    });
    input.addEventListener('keydown', function(e){ if (e.key==='Escape'){ results.classList.remove('open'); input.blur(); } });
    document.addEventListener('click', function(e){ if (!results.contains(e.target) && e.target!==input) results.classList.remove('open'); });
  }
  function wireHeroSearch(){
    wireSearch(document.getElementById('heroSearch'), document.getElementById('heroSearchResults'));
    /* a busca do cabeçalho existia no HTML sem nenhuma função — agora usa o mesmo motor da busca do hero */
    var hdr = document.getElementById('headerSearch');
    if (hdr){
      var box = hdr.parentNode, res = el('div', {class:'hero-search-results header-search-results'});
      box.appendChild(res);
      wireSearch(hdr, res);
    }
  }
  
  /* ============================================================
     TAB SWITCHING
     ============================================================ */
  function switchTab(tab){
    if ((tab === 'painel' || tab === 'historico' || tab === 'csv') && !IS_PROFESSOR) return;
    if (tab === 'plano' && IS_PROFESSOR) return;
    try{ sessionStorage.setItem('bussola_tab', tab); }catch(e){} // aluno não tem acesso ao painel de métricas
    state.tab = tab;
    document.querySelectorAll('.tab-btn').forEach(function(b){ b.setAttribute('aria-selected', String(b.getAttribute('data-tab')===tab)); });
    document.querySelectorAll('.view').forEach(function(v){ v.classList.remove('active'); });
    document.getElementById('view-'+tab).classList.add('active');
    document.body.setAttribute('data-tab', tab);
    if (tab === 'predio'){ UI.renderRoomsGrid(); }
    var activeBtn = document.querySelector('.tab-btn[data-tab="'+tab+'"]');
    if (activeBtn && activeBtn.scrollIntoView){ try{ activeBtn.scrollIntoView({inline:'center', block:'nearest'}); }catch(e){} }
  }
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.addEventListener('click', function(){ switchTab(b.getAttribute('data-tab')); }); });
  
  /* ============================================================
     ROLE GATING — só professor vê/acessa o Painel de métricas
     ============================================================ */
  function applyRoleGating(){
    ['tabHistoricoBtn','tabPainelBtn','tabCsvBtn'].forEach(function(id){ var b=document.getElementById(id); if(b && !IS_PROFESSOR) b.style.display='none'; });
    var tp=document.getElementById('tabPlanoBtn'); if(tp && IS_PROFESSOR) tp.style.display='none';
    var painelBtn = document.getElementById('tabPainelBtn');
    if (!IS_PROFESSOR){
      if (painelBtn) painelBtn.style.display = 'none';
      var painelView = document.getElementById('view-painel');
      if (painelView){ painelView.classList.remove('active'); painelView.style.display = 'none'; }
      // se por algum motivo a view do Painel ficou ativa (ex.: link direto), volta pra Salas
      if (state.tab === 'painel') switchTab('predio');
    }
  }
  
  /* ============================================================
     USER BADGE (cabeçalho)
     ============================================================ */
  function renderUserBadge(){
    var wrap = document.getElementById('userBadge');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!SESSION) return;
    var badge = el('span', {class:'role-badge '+SESSION.role}, [SESSION.role === 'professor' ? 'Professor(a)' : 'Estudante']);
    var name = el('span', {style:'font-size:12.5px; font-weight:600; color:rgba(246,243,236,.8); margin:0 4px;'}, [SESSION.nome]);
    var sair = el('button', {style:'background:none; border:none; color:rgba(246,243,236,.5); font-size:11.5px; font-weight:700; cursor:pointer; text-decoration:underline;'}, ['sair']);
    sair.addEventListener('click', function(){ window.BussolaAuth.logout(); });
    wrap.appendChild(name);
    wrap.appendChild(badge);
    wrap.appendChild(sair);
  }
  
  /* ============================================================
     COURSE SWITCHER (grid ao lado da logo)
     ============================================================ */
  function renderCourseSwitcher(){
    var btn = document.getElementById('courseGridBtn');
    var dropdown = document.getElementById('courseDropdown');
    if (!btn || !dropdown) return;
    var COURSES = window.BUSSOLA_COURSES || {};
    dropdown.innerHTML = '';
    var groups = window.BUSSOLA_GROUPS || {}, seenG = {};
    function openPicker(gid){
      var g = groups[gid], box = el('div', {class:'cp-card'}, [el('h3', {}, [g.nome]), el('p', {}, [g.descricao + ':'])]);
      Object.keys(COURSES).filter(function(i){ return COURSES[i].grupo === gid; }).forEach(function(i){
        box.appendChild(el('a', {class:'cp-opt'+(i===CURSO?' active':''), href:'index.html?curso='+i}, [el('b', {}, [COURSES[i].sigla]), el('span', {}, [COURSES[i].nome])]));
      });
      var close = el('button', {type:'button', class:'cp-close'}, ['Cancelar']), ov = el('div', {class:'cp-overlay'}, [box]);
      box.appendChild(close); close.onclick = function(){ ov.remove(); };
      ov.addEventListener('click', function(e){ if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }
    window.__openPicker = openPicker;
    Object.keys(COURSES).forEach(function(id){
      var c = COURSES[id];
      if (c.grupo){
        if (seenG[c.grupo]) return; seenG[c.grupo] = 1;
        var g = groups[c.grupo], gi = el('a', {class:'cd-item'+(COURSE.grupo===c.grupo?' active':''), href:'#'}, [
          el('div', {class:'cd-top'}, [el('span', {class:'cd-sigla'}, [g.sigla]), el('span', {class:'cd-status completo'}, ['4 cursos'])]),
          el('div', {class:'cd-nome'}, [g.nome])]);
        gi.addEventListener('click', function(e){ e.preventDefault(); dropdown.classList.remove('open'); openPicker(c.grupo); });
        dropdown.appendChild(gi); return;
      }
      var isActive = id === CURSO;
      var item = el('a', {class:'cd-item'+(isActive?' active':''), href:'index.html?curso='+id}, [
        el('div', {class:'cd-top'}, [
          el('span', {class:'cd-sigla'}, [c.sigla]),
          el('span', {class:'cd-status '+c.status}, [c.status === 'completo' ? 'Completo' : 'Escopo'])
        ]),
        el('div', {class:'cd-nome'}, [c.nome])
      ]);
      dropdown.appendChild(item);
    });
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function(e){
      if (!dropdown.contains(e.target) && e.target !== btn){
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  
  /* ============================================================
     COURSE EYEBROW + SCOPE BANNER
     ============================================================ */
  function renderCourseIdentity(){
    /* "Painel de Salas UNIRIO" (wordmark + <title> estático) é a identidade fixa
       do sistema — não varia por curso. Só o título da região azul (hero) e o
       rótulo acima dele mudam, de acordo com o curso/unidade selecionado. */
    var THEME_MAP = { eng:'eng', mat:'mat' };
    var theme = THEME_MAP[CURSO] || (CURSO.indexOf('ibio') === 0 ? 'ibio' : '');
    if (theme) document.body.setAttribute('data-theme', theme);
    else document.body.removeAttribute('data-theme');
    var painel = COURSE.painel || COURSE.unidade || 'CCET';
    document.title = 'Painel CCET X IBIO · ' + (COURSE.nome || '');
    var h1 = document.querySelector('.hero h1');
    if (h1){ h1.innerHTML = ''; h1.appendChild(document.createTextNode('Painel ' + painel + ' ')); h1.appendChild(el('em', {}, [COURSE.nome || ''])); }
    var gt = document.querySelector('.grade-toggle'); if (gt) gt.style.display = (CURSO === 'bsi') ? '' : 'none';
    /* o rótulo acima do título (eyebrow) carrega sigla + período — nunca repete
       o nome do curso, que já aparece, uma única vez, no título abaixo */
    var eyebrow = document.getElementById('courseEyebrow');
    if (eyebrow) eyebrow.textContent = painel + ' · ' + (COURSE.sigla || '') + ' · 2026/2';

    var banner = document.getElementById('scopeBanner');
    if (!banner) return;
    if (COURSE.status === 'escopo'){
      banner.hidden = false;
      banner.innerHTML =
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
        '<span><b>Versão de escopo — ' + COURSE.nome + '.</b> ' + COURSE.descricao + '</span>';
    } else {
      banner.hidden = true;
    }
  }
  
  /* ============================================================
     GRADE (curriculum) TOGGLE
     ============================================================ */
  document.querySelectorAll('.grade-toggle button').forEach(function(b){
    b.addEventListener('click', function(){
      state.grade = b.getAttribute('data-grade');
      document.querySelectorAll('.grade-toggle button').forEach(function(x){ x.setAttribute('aria-pressed', String(x===b)); });
      UI.renderNowList();
      renderSchedule();
      renderDiscTable();
      UI.renderRoomsGrid();
    });
  });
  
  /* ============================================================
     INIT
     ============================================================ */
  function init(){
    renderUserBadge();
    applyRoleGating();
    renderCourseSwitcher();
    if (PICK_GROUP && window.__openPicker) window.__openPicker(PICK_GROUP);
    renderCourseIdentity();
    UI.renderClock();
    UI.renderNowList();
    UI.renderKPIs();
    UI.renderCharts();
    UI.renderFilterBarPredio();
    UI.renderRoomsGrid();
    renderFilterBarGrade();
    renderSchedule();
    renderFilterBarDisc();
    renderDiscTable();
    wireHeroSearch();
    /* placeholder curto em telas estreitas (o longo ficava cortado) */
    if (window.matchMedia && window.matchMedia('(max-width: 700px)').matches){
      var hs = document.getElementById('heroSearch'); if (hs) hs.placeholder = 'Sigla, professor ou sala…';
    }
  
    setInterval(function(){
      UI.renderClock();
      UI.renderNowList();
      renderSchedule();
      UI.renderRoomsGrid();
    }, 30000);
  
    window.addEventListener('resize', function(){ /* layout is fluid */ });
  }
  
  window.__b_ui.openDrawer = openDrawer;
  init();
  
  })();