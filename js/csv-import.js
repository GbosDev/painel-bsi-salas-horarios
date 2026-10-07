(function(){
  "use strict";
  var B=window.__BUSSOLA__, H=window.__b_helpers, el=H.el, root=document.getElementById('view-csv');
  if(!root||!B.IS_PROFESSOR){ return; }
  var C = B.CURSO;

  /* ============================================================
     ESPECIFICAÇÃO DO CSV
     ------------------------------------------------------------
     O sistema aceita DOIS formatos, detectados automaticamente pelo
     cabeçalho — não é preciso escolher um modo manualmente:

     • "Grade dupla" (recomendado — é o formato da planilha oficial de
       horários): cada linha pode trazer a disciplina da grade antiga
       (2008) e/ou da grade nova (2023) lado a lado, com Professor,
       Sala, Vagas e Horários compartilhados entre as duas.
     • "Grade única": uma linha = uma disciplina de uma grade só
       (útil para cursos sem correspondência de grade antiga).

     Em QUALQUER formato, só duas coisas são realmente obrigatórias:
     Sigla e Disciplina de pelo menos uma das grades na linha. Tudo o
     mais é opcional e recebe um valor padrão sensato.
     ============================================================ */
  var ALIASES_DUAL = {
    siglaAntiga:['siglaantiga','sigla2008','siglagradeantiga'],
    nomeAntiga:['disciplinaantiga','nomeantiga','disciplina2008','nome2008'],
    codigoAntiga:['codigoantiga','cod2008','codigo2008'],
    periodoAntiga:['periodoantiga','periodo2008'],
    siglaAtual:['siglaatual','sigla2023','siglanova','siglagradenova','siglagradeatual'],
    nomeAtual:['disciplinaatual','nomeatual','disciplina2023','nome2023','disciplinanova','nomenova'],
    codigoAtual:['codigoatual','cod2023','codigo2023'],
    periodoAtual:['periodoatual','periodo2023']
  };
  var ALIASES_SIMPLE = {
    sigla:['sigla'],
    nome:['disciplina','nome'],
    codigo:['codigo','código','cod'],
    periodo:['periodo','período'],
    grade:['grade','curriculo','currículo']
  };
  var ALIASES_SHARED = {
    professor:['professor','docente','professora'],
    sala:['sala','ambiente','espaco','espaço'],
    vagas:['vagas','capacidade'],
    secao:['secao','seção','tipo'],
    id:['id']
  };
  var ALIASES_HORARIO = ['horario','horarios','horário','horários','sessao','sessoes','sessão','sessões'];

  var SPEC_ROWS = [
    ['Sigla + Disciplina', 'Obrigatória', '(de pelo menos uma das grades, antiga ou atual)', 'Ex.: "ALGPROG/I" + "Algoritmos e Programação (ingressantes)"'],
    ['SiglaAntiga + DisciplinaAntiga', 'Opcional', 'Sigla2008, Nome2008', 'Preenche a correspondência na grade 2008 — deixe em branco se a turma não existir na grade antiga'],
    ['SiglaAtual + DisciplinaAtual', 'Opcional', 'Sigla2023, Nome2023, SiglaNova', 'Preenche a correspondência na grade 2023 — deixe em branco se a turma for exclusiva da grade antiga'],
    ['Codigo / Período (Antiga ou Atual)', 'Opcional', 'Cod2008, Cod2023…', 'Código da disciplina e período (1–10, "A" ou "O")'],
    ['Professor', 'Opcional', 'Docente', 'Nome do(a) professor(a) responsável'],
    ['Sala', 'Opcional', 'Ambiente, Espaço', 'Nome exato da sala (ex.: Sala 212); em branco = sem sala fixa'],
    ['Vagas', 'Opcional', 'Capacidade', 'Número inteiro'],
    ['Horario1, Horario2…', 'Opcional', 'Horários, Sessões', 'Uma coluna por horário, no formato "DIA HORA" — ex.: "3ª 14h" ou "SEG 14:00". Pode repetir quantas colunas precisar.']
  ];

  var DAY_NAME_ALIASES = {
    seg:1, segunda:1, 'segunda-feira':1,
    ter:2, terca:2, 'terca-feira':2,
    qua:3, quarta:3, 'quarta-feira':3,
    qui:4, quinta:4, 'quinta-feira':4,
    sex:5, sexta:5, 'sexta-feira':5,
    sab:6, sabado:6
  };

  function normalize(s){ return String(s==null?'':s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }

  /* aceita tanto o formato acadêmico "2ª", "3ª"… (2ª = segunda) quanto
     números diretos 1–6 (1 = segunda) e nomes/abreviações do dia */
  function parseDay(tok){
    var raw = String(tok||'').trim().toLowerCase();
    if (!raw) return null;
    var ord = raw.match(/^(\d)\s*[ºª]/);
    if (ord){ var n = parseInt(ord[1],10); return (n>=2 && n<=7) ? (n-1) : null; }
    var bare = raw.match(/^([1-6])$/);
    if (bare) return parseInt(bare[1],10);
    return DAY_NAME_ALIASES[normalize(raw)] || null;
  }
  /* aceita "14h", "14h00", "14:00" e "14" */
  function parseHour(tok){
    var m = String(tok||'').trim().toLowerCase().match(/^(\d{1,2})\s*h?\s*(?::?(\d{2}))?$/);
    return m ? parseInt(m[1],10) : null;
  }
  function parseHorarioCell(raw){
    if (!raw || !String(raw).trim()) return { sessions:[], invalid:[] };
    var sessions = [], invalid = [];
    String(raw).split('|').map(function(c){ return c.trim(); }).filter(Boolean).forEach(function(chunk){
      var parts = chunk.split(/\s+/);
      var day = parseDay(parts[0]), hour = parts[1]!==undefined ? parseHour(parts.slice(1).join(' ')) : null;
      if (day==null || hour==null) invalid.push(chunk); else sessions.push({day_num:day, hour:hour});
    });
    return { sessions:sessions, invalid:invalid };
  }

  /* ---- parser CSV tolerante a , ou ; e a campos entre aspas ---- */
  function parseCSV(text){
    text = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
    var firstLine = (text.split('\n')[0] || '');
    var delim = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
    var rows=[], row=[], field='', inQuotes=false;
    for (var i=0;i<text.length;i++){
      var c = text[i];
      if (inQuotes){
        if (c === '"'){ if (text[i+1]==='"'){ field+='"'; i++; } else inQuotes=false; }
        else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === delim){ row.push(field); field=''; }
        else if (c === '\n'){ row.push(field); rows.push(row); row=[]; field=''; }
        else field += c;
      }
    }
    if (field.length || row.length){ row.push(field); rows.push(row); }
    return rows.filter(function(r){ return r.length>1 || (r.length===1 && r[0].trim()!==''); });
  }

  /* ---- identificação automática do formato pelo cabeçalho ---- */
  function buildHeaderMap(headerRow){
    var map = {}, horarioCols = [];
    var dualFields = Object.keys(ALIASES_DUAL), simpleFields = Object.keys(ALIASES_SIMPLE), sharedFields = Object.keys(ALIASES_SHARED);
    headerRow.forEach(function(h, idx){
      var norm = normalize(h);
      var matched = false;
      [].concat(dualFields, simpleFields, sharedFields).forEach(function(field){
        if (map[field] !== undefined || matched) return;
        var aliases = ALIASES_DUAL[field] || ALIASES_SIMPLE[field] || ALIASES_SHARED[field];
        if (aliases.some(function(a){ return normalize(a)===norm; })){ map[field]=idx; matched=true; }
      });
      if (!matched){
        var isHorario = ALIASES_HORARIO.some(function(a){ return norm.indexOf(normalize(a))===0 && norm.length <= normalize(a).length+2; });
        var continuesHorario = (norm==='' && horarioCols.length && idx === horarioCols[horarioCols.length-1]+1);
        if (isHorario || continuesHorario) horarioCols.push(idx);
      }
    });
    var isDual = dualFields.some(function(f){ return map[f]!==undefined; });
    return { map:map, horarioCols:horarioCols, isDual:isDual };
  }

  function val(cols, map, field){ var idx = map[field]; return idx===undefined ? '' : (cols[idx]||'').trim(); }

  function collectSessions(cols, horarioCols){
    var sessions = [], invalid = [];
    horarioCols.forEach(function(idx){
      var r = parseHorarioCell(cols[idx]);
      sessions = sessions.concat(r.sessions);
      invalid = invalid.concat(r.invalid);
    });
    return { sessions:sessions, invalid:invalid };
  }

  function processRow(cols, header, rowNum){
    var map = header.map;
    function err(msg){ return { ok:false, rowNum:rowNum, message:msg }; }
    var h = collectSessions(cols, header.horarioCols);
    var warn = h.invalid.length ? ('Horário(s) ignorado(s) por formato não reconhecido: "'+h.invalid.join('", "')+'"') : null;

    if (header.isDual){
      var sA=val(cols,map,'siglaAntiga'), nA=val(cols,map,'nomeAntiga');
      var sU=val(cols,map,'siglaAtual'), nU=val(cols,map,'nomeAtual');
      if ((!sA || !nA) && (!sU || !nU)){
        if (sA||nA||sU||nU) return err('Sigla e Disciplina devem vir juntas em pelo menos uma das grades');
        return err('Nenhuma disciplina informada (preencha a grade antiga e/ou a atual)');
      }
      var curr2008 = (sA && nA) ? { sigla:sA, nome:nA, codigo:val(cols,map,'codigoAntiga'), periodo:val(cols,map,'periodoAntiga')||'1' } : null;
      var curr2023 = (sU && nU) ? { sigla:sU, nome:nU, codigo:val(cols,map,'codigoAtual'), periodo:val(cols,map,'periodoAtual')||'1' } : null;
      return { ok:true, rowNum:rowNum, warning:warn, record:{
        matchSigla: sU||sA, matchGrade: sU ? '2023' : '2008',
        curr2008:curr2008, curr2023:curr2023,
        professor: val(cols,map,'professor'), sala: val(cols,map,'sala')||null, vagas: parseInt(val(cols,map,'vagas'),10)||0,
        section: normalize(val(cols,map,'secao'))==='pos' ? 'pos' : 'regular',
        sessions: h.sessions, id: val(cols,map,'id')||null
      }};
    }

    var sigla = val(cols,map,'sigla'), nome = val(cols,map,'nome');
    if (!sigla || !nome) return err('Sigla e Disciplina são obrigatórias');
    var grade = (normalize(val(cols,map,'grade'))==='2008') ? '2008' : '2023';
    var curr = { sigla:sigla, nome:nome, codigo:val(cols,map,'codigo'), periodo:val(cols,map,'periodo')||'1' };
    return { ok:true, rowNum:rowNum, warning:warn, record:{
      matchSigla: sigla, matchGrade: grade,
      curr2008: grade==='2008' ? curr : null, curr2023: grade==='2023' ? curr : null,
      professor: val(cols,map,'professor'), sala: val(cols,map,'sala')||null, vagas: parseInt(val(cols,map,'vagas'),10)||0,
      section: normalize(val(cols,map,'secao'))==='pos' ? 'pos' : 'regular',
      sessions: h.sessions, id: val(cols,map,'id')||null
    }};
  }

  function currentDataset(){
    var dataset = (window.BUSSOLA_DATASETS && window.BUSSOLA_DATASETS[C]) || [];
    if (window.BussolaStore) dataset = BussolaStore.apply(C, dataset);
    return dataset;
  }

  function findExisting(dataset, record){
    if (record.id){
      var byId = dataset.filter(function(r){ return String(r.id)===String(record.id); });
      if (byId.length) return byId[0];
    }
    return dataset.filter(function(r){
      var c = record.matchGrade==='2008' ? r.curr2008 : r.curr2023;
      return c && normalize(c.sigla)===normalize(record.matchSigla);
    })[0] || null;
  }

  function toSessionObjs(sessions){
    return sessions.map(function(s){ return { day_num:s.day_num, day_label:H.DAY_FULL[s.day_num], day_short:H.DAY_SHORT[s.day_num], hour:s.hour }; });
  }

  function applyRow(record, motivo){
    var dataset = currentDataset();
    var existing = findExisting(dataset, record);
    var depois = { professor:record.professor||'—', sala:record.sala||'—', vagas:record.vagas||0,
      horarios: record.sessions.map(function(s){return H.DAY_SHORT[s.day_num]+' '+H.fmtHour(s.hour);}).join(' · ')||'—' };
    var turmaSigla = (record.curr2023&&record.curr2023.sigla) || (record.curr2008&&record.curr2008.sigla) || '—';
    var turmaNome = (record.curr2023&&record.curr2023.nome) || (record.curr2008&&record.curr2008.nome) || '—';

    if (existing){
      var antes = { professor:existing.professor||'—', sala:existing.sala||'—', vagas:existing.vagas||0,
        horarios: (existing.sessions||[]).map(function(s){return s.day_short+' '+H.fmtHour(s.hour);}).join(' · ')||'—' };
      var patch = { professor: record.professor, sala: record.sala, vagas: record.vagas, section: record.section };
      if (record.sessions.length) patch.sessions = toSessionObjs(record.sessions);
      if (record.curr2008) patch.curr2008 = record.curr2008;
      if (record.curr2023) patch.curr2023 = record.curr2023;
      H.saveOverride(existing.id, patch);
      H.logAudit({ curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:'csv_atualizada', turmaSigla:turmaSigla, turmaNome:turmaNome, motivo:motivo, antes:antes, depois:depois });
      return 'atualizada';
    }
    window.BussolaStore.addRecord(C, {
      curr2008: record.curr2008, curr2023: record.curr2023,
      professor: record.professor, sala: record.sala, vagas: record.vagas, section: record.section,
      sessions: toSessionObjs(record.sessions)
    });
    H.logAudit({ curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:'csv_criada', turmaSigla:turmaSigla, turmaNome:turmaNome, motivo:motivo, antes:{}, depois:depois });
    return 'criada';
  }

  /* ============================================================
     TEMPLATE — espelha exatamente a planilha oficial de horários
     (duas grades lado a lado + Horario1/Horario2 separados)
     ============================================================ */
  function downloadTemplate(){
    var header = 'SiglaAntiga,DisciplinaAntiga,CodigoAntiga,PeriodoAntiga,SiglaAtual,DisciplinaAtual,CodigoAtual,PeriodoAtual,Professor,Horario1,Horario2,Sala,Vagas';
    var ex1 = ',,,,ALGPROG/I,Algoritmos e Programação (ingressantes),TIN0222,1,Prof. Jefferson,3ª 14h,5ª 14h,Lab. 3,36';
    var ex2 = 'TP1,Técnicas de Programação I,TIN0107,1,ALGPROG/V,Algoritmos e Programação (veteranos),TIN0222,1,Prof. Reinaldo,3ª 14h,5ª 14h,Lab. SAN,30';
    var blob = new Blob([header+'\n'+ex1+'\n'+ex2+'\n'], {type:'text/csv;charset=utf-8'});
    var a = el('a', {href: URL.createObjectURL(blob), download:'bussola_modelo_'+C+'.csv'});
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ============================================================
     CATÁLOGO DE SALAS
     ============================================================ */
  function roomsCard(){
    function inUse(room){ return B.RECORDS.filter(function(r){return r.sala===room;}).length; }
    var rn = el('input',{type:'text',placeholder:'Nova sala (ex.: Sala 301)'});
    var ra = el('button',{type:'button',class:'edit-save-btn'},['Adicionar sala']);
    ra.onclick = function(){
      var v = rn.value.trim(); if (!v) return;
      BussolaStore.addRoom(C, v);
      H.logAudit({ curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:'sala_add', turmaSigla:'—', turmaNome:'Catálogo de salas', motivo:'Sala adicionada ao catálogo', antes:{}, depois:{sala:v} });
      BussolaStore.refresh();
    };
    var chips = el('div',{class:'ad-rooms'});
    H.ALL_ROOMS.slice().sort().forEach(function(r){
      var u = inUse(r), x = el('button',{type:'button',title:u?'Sala em uso por '+u+' turma(s)':'Remover sala'},['×']);
      x.onclick = function(){
        if (u){ x.parentNode.classList.add('shake'); setTimeout(function(){x.parentNode.classList.remove('shake');},400); return; }
        BussolaStore.removeRoom(C, r);
        H.logAudit({ curso:C, cursoNome:(B.COURSE&&B.COURSE.nome)||C, tipo:'sala_remove', turmaSigla:'—', turmaNome:'Catálogo de salas', motivo:'Sala removida do catálogo', antes:{sala:r}, depois:{} });
        BussolaStore.refresh();
      };
      chips.appendChild(el('span',{class:'ad-chip'+(u?' used':'')},[r+(u?' · '+u:''),x]));
    });
    return el('div',{class:'ad-card'},[el('div',{class:'ad-head'},[el('h3',{},['Salas'])]),el('div',{class:'ad-add'},[rn,ra]),chips]);
  }

  /* ============================================================
     UI
     ============================================================ */
  var parsedRows = [];

  function draw(){
    root.innerHTML = '';
    root.appendChild(el('div', {class:'section-head'}, [
      el('div', {}, [
        el('h2', {}, ['Atualização de dados por planilha']),
        el('div', {class:'desc'}, ['Caminho oficial para atualizar professores, salas e horários. O sistema reconhece automaticamente o formato da sua planilha pelo cabeçalho.'])
      ]),
      (function(){ var b = el('button', {type:'button', class:'csv-template-btn exmod-trigger'}, ['⚠ Ajuste excepcional']); b.onclick = function(){ window.__b_exceptional.open(); }; return b; })()
    ]));

    var card = el('div', {class:'csv-card'});

    card.appendChild(el('div', {class:'csv-course-box'}, [
      el('div', {}, [el('b',{},['Curso de destino: ']), (B.COURSE.unidade||'')+' · '+(B.COURSE.sigla||C)+' — '+(B.COURSE.nome||'')]),
      el('div', {class:'csv-course-sub'}, ['A importação é sempre aplicada ao curso que você está visualizando agora. Para atualizar outro curso, abra o painel dele e importe por lá.'])
    ]));

    card.appendChild(el('div', {class:'csv-head'}, [
      el('div', {}, [
        el('h3', {style:'margin:0 0 4px;'}, ['Formato da planilha']),
        el('div', {class:'desc'}, ['Só Sigla + Disciplina (de uma das grades) são obrigatórias. O sistema identifica sozinho se a planilha traz uma grade só ou as duas lado a lado, e ignora colunas que não reconhece.'])
      ]),
      (function(){ var b = el('button', {type:'button', class:'csv-template-btn'}, ['⬇ Baixar modelo (.csv)']); b.onclick = downloadTemplate; return b; })()
    ]));

    var specTable = el('table', {class:'csv-spec-table'}, [
      el('thead', {}, [el('tr', {}, ['Coluna','Status','Aceita também','Formato / exemplo'].map(function(h){ return el('th',{},[h]); }))]),
      el('tbody', {}, SPEC_ROWS.map(function(r){
        return el('tr', {}, [
          el('td', {}, [r[0]]),
          el('td', {class: r[1]==='Obrigatória' ? 'req':'opt'}, [r[1]]),
          el('td', {}, [r[2]]),
          el('td', {}, [r[3]])
        ]);
      }))
    ]);
    card.appendChild(specTable);

    card.appendChild(el('div', {class:'desc', style:'margin-bottom:14px;'}, [
      'Se já existir uma turma com a mesma sigla (na mesma grade), os campos da linha sobrescrevem essa turma — inclusive nome/código/período da grade informada. Caso contrário, uma turma nova é criada.'
    ]));

    var obsInput = el('textarea', {rows:'2', placeholder:'Opcional — ex.: "Atualização do semestre 2026/2 recebida da coordenação do BSI em 07/10."'});
    card.appendChild(el('div', {class:'edit-field'}, [el('label',{},['Observação deste lote (aparece no histórico de alterações)']), obsInput]));

    var fileInput = el('input', {type:'file', accept:'.csv,text/csv'});
    card.appendChild(el('div', {class:'csv-drop'}, [el('div', {}, ['Selecione o arquivo .csv exportado da sua planilha']), fileInput]));

    var resultsWrap = el('div', {id:'csvResultsWrap'});
    card.appendChild(resultsWrap);

    fileInput.addEventListener('change', function(){
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(){
        var rows = parseCSV(String(reader.result||''));
        if (!rows.length){ resultsWrap.innerHTML=''; resultsWrap.appendChild(el('div',{class:'desc'},['Arquivo vazio ou ilegível.'])); return; }
        var header = buildHeaderMap(rows[0]);
        parsedRows = rows.slice(1).map(function(cols, i){ return processRow(cols, header, i+2); });
        renderResults(header);
      };
      reader.readAsText(file, 'UTF-8');
    });

    function renderResults(header){
      resultsWrap.innerHTML = '';
      var ok = parsedRows.filter(function(r){ return r.ok; });
      var bad = parsedRows.filter(function(r){ return !r.ok; });
      var warned = ok.filter(function(r){ return r.warning; });

      resultsWrap.appendChild(el('div', {class:'desc'}, ['Formato identificado: '+(header.isDual ? 'grade dupla (antiga + atual)' : 'grade única') + '.']));
      resultsWrap.appendChild(el('div', {class:'csv-summary'}, [
        el('div', {}, [el('div',{class:'n'},[String(parsedRows.length)]), el('div',{class:'lbl'},['linhas lidas'])]),
        el('div', {}, [el('div',{class:'n'},[String(ok.length)]), el('div',{class:'lbl'},['prontas para gravar'])]),
        el('div', {}, [el('div',{class:'n'},[String(bad.length)]), el('div',{class:'lbl'},['com erro (ignoradas)'])]),
        el('div', {}, [el('div',{class:'n'},[String(warned.length)]), el('div',{class:'lbl'},['com aviso de horário'])])
      ]));

      var tbody = el('tbody', {});
      parsedRows.forEach(function(r){
        if (r.ok){
          var rec = r.record;
          var siglaMostrada = (rec.curr2023&&rec.curr2023.sigla) || (rec.curr2008&&rec.curr2008.sigla) || '—';
          var nomeMostrado = (rec.curr2023&&rec.curr2023.nome) || (rec.curr2008&&rec.curr2008.nome) || '—';
          tbody.appendChild(el('tr', {}, [
            el('td', {}, [String(r.rowNum)]),
            el('td', {}, [el('span',{class:'csv-status-pill '+(r.warning?'erro':'ok')},[r.warning?'aviso':'válida'])]),
            el('td', {}, [siglaMostrada]),
            el('td', {}, [nomeMostrado]),
            el('td', {}, [rec.professor||'—']),
            el('td', {}, [rec.sala||'—']),
            el('td', {}, [rec.sessions.map(function(s){ return H.DAY_SHORT[s.day_num]+' '+H.fmtHour(s.hour); }).join(' · ') || '—']),
            el('td', {}, [r.warning||'—'])
          ]));
        } else {
          tbody.appendChild(el('tr', {}, [
            el('td', {}, [String(r.rowNum)]),
            el('td', {}, [el('span',{class:'csv-status-pill erro'},['erro'])]),
            el('td', {colspan:'6'}, [r.message])
          ]));
        }
      });
      resultsWrap.appendChild(el('div', {class:'csv-preview-wrap'}, [
        el('table', {class:'csv-preview-table'}, [
          el('thead', {}, [el('tr', {}, ['Linha','Status','Sigla','Disciplina','Professor','Sala','Horários','Obs.'].map(function(h){ return el('th',{},[h]); }))]),
          tbody
        ])
      ]));

      var applyBtn = el('button', {type:'button', class:'csv-apply-btn'}, ['Aplicar '+ok.length+' alteração(ões)']);
      applyBtn.disabled = !ok.length;
      applyBtn.addEventListener('click', function(){
        var motivo = obsInput.value.trim() || 'Importação por planilha CSV';
        var counts = { criada:0, atualizada:0 };
        ok.forEach(function(r){ counts[applyRow(r.record, motivo)]++; });
        resultsWrap.appendChild(el('div', {class:'edit-saved-note'}, [
          counts.criada+' turma(s) criada(s) e '+counts.atualizada+' atualizada(s). Recarregando para aplicar ao curso atual…'
        ]));
        setTimeout(function(){ BussolaStore.refresh(); }, 900);
      });
      resultsWrap.appendChild(applyBtn);
    }

    root.appendChild(card);
    root.appendChild(roomsCard());
  }

  document.querySelector('[data-tab="csv"]').addEventListener('click', draw);
  draw();
})();
