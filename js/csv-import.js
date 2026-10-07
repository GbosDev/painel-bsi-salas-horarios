(function(){
    "use strict";
    var B=window.__BUSSOLA__, H=window.__b_helpers, el=H.el, root=document.getElementById('view-csv');
    if(!root||!B.IS_PROFESSOR){ return; }
  
    /* ============================================================
       ESPECIFICAÇÃO DO CSV
       ============================================================ */
    var HEADER_ALIASES = {
      centro:['centro','predio','prédio','escola','unidade'],
      curso:['curso','course'],
      sigla:['sigla'],
      disciplina:['disciplina','nome'],
      codigo:['codigo','código','cod'],
      periodo:['periodo','período'],
      grade:['grade','curriculo','currículo'],
      professor:['professor','docente','professora'],
      sala:['sala','ambiente','espaco','espaço'],
      vagas:['vagas','capacidade'],
      secao:['secao','seção','tipo'],
      horarios:['horarios','horários','horario','horário','sessoes','sessões'],
      id:['id']
    };
    var SPEC_ROWS = [
      ['Centro', 'Obrigatória', 'Prédio, Escola, Unidade', 'CCET ou IBIO'],
      ['Curso', 'Obrigatória', 'Course', 'Sigla (BSI, ENG, MAT, CBIO·B…) ou nome completo (Sistemas de Informação, Engenharia de Produção, Licenciatura em Matemática…)'],
      ['Sigla', 'Obrigatória', '—', 'Sigla da disciplina (ex.: BD1). É usada para localizar a turma e decidir se ela deve ser atualizada ou criada.'],
      ['Disciplina', 'Obrigatória', 'Nome', 'Nome completo da disciplina'],
      ['Codigo', 'Opcional', 'Cód.', 'Código da disciplina (só é gravado ao criar uma turma nova)'],
      ['Periodo', 'Opcional', '—', '1 a 10, "A" (atividades) ou "O" (optativas)'],
      ['Grade', 'Opcional · padrão 2023', 'Currículo', '"2023" ou "2008"'],
      ['Professor', 'Opcional', 'Docente', 'Nome do(a) professor(a) responsável'],
      ['Sala', 'Opcional', 'Ambiente, Espaço', 'Nome exato da sala (ex.: Sala 212); em branco = sem sala fixa'],
      ['Vagas', 'Opcional', 'Capacidade', 'Número inteiro'],
      ['Secao', 'Opcional · padrão regular', 'Tipo', '"regular" ou "pos"'],
      ['Horarios', 'Opcional', 'Horário, Sessões', 'Um ou mais horários separados por " \| ", cada um como "DIA HH:MM" — ex.: "SEG 14:00 \| QUA 14:00". Dias aceitos: SEG, TER, QUA, QUI, SEX, SAB (ou nomes completos).'],
      ['ID', 'Opcional', '—', 'ID exato de uma turma existente, para forçar a atualização mesmo que a sigla tenha mudado.']
    ];
    var DAY_ALIASES = {
      '1':1,'seg':1,'segunda':1,'segunda-feira':1,
      '2':2,'ter':2,'terca':2,'terça':2,'terca-feira':2,'terça-feira':2,
      '3':3,'qua':3,'quarta':3,'quarta-feira':3,
      '4':4,'qui':4,'quinta':4,'quinta-feira':4,
      '5':5,'sex':5,'sexta':5,'sexta-feira':5,
      '6':6,'sab':6,'sábado':6,'sabado':6
    };
  
    function normalize(s){ return String(s==null?'':s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  
    function resolveCourseKey(centroRaw, cursoRaw){
      var centro = normalize(centroRaw), curso = normalize(cursoRaw);
      var all = Object.keys(window.BUSSOLA_COURSES||{}).map(function(k){ return window.BUSSOLA_COURSES[k]; });
      var byId = all.filter(function(c){ return normalize(c.id)===curso; });
      if (byId.length===1) return byId[0].id;
      var bySigla = all.filter(function(c){ return normalize(c.sigla)===curso; });
      var byNome = all.filter(function(c){ return normalize(c.nome)===curso || normalize(c.nome).indexOf(curso)!==-1; });
      var pool = bySigla.length ? bySigla : byNome;
      if (!pool.length) return null;
      if (pool.length===1) return pool[0].id;
      var narrowed = pool.filter(function(c){ return normalize(c.unidade)===centro || normalize(c.painel)===centro; });
      return narrowed.length===1 ? narrowed[0].id : null;
    }
  
    function parseDay(tok){ return DAY_ALIASES[normalize(tok)] || null; }
    function parseHour(tok){ var m = String(tok||'').trim().match(/^(\d{1,2})(:\d{2})?$/); return m ? parseInt(m[1],10) : null; }
    function parseHorarios(raw){
      if (!raw) return [];
      return raw.split('|').map(function(c){ return c.trim(); }).filter(Boolean).map(function(chunk){
        var parts = chunk.split(/\s+/);
        var day = parseDay(parts[0]), hour = parts[1]!==undefined ? parseHour(parts[1]) : null;
        return (day==null || hour==null) ? null : { day_num:day, hour:hour };
      });
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
  
    function buildHeaderMap(headerRow){
      var map = {};
      headerRow.forEach(function(h, idx){
        var norm = normalize(h);
        Object.keys(HEADER_ALIASES).forEach(function(field){
          if (map[field] !== undefined) return;
          if (HEADER_ALIASES[field].some(function(a){ return normalize(a)===norm; })) map[field] = idx;
        });
      });
      return map;
    }
  
    function processRow(cols, map, rowNum){
      function val(f){ var idx = map[f]; return idx===undefined ? '' : (cols[idx]||'').trim(); }
      function err(msg){ return { ok:false, rowNum:rowNum, message:msg }; }
  
      var centro = val('centro'), cursoTxt = val('curso'), sigla = val('sigla'), disciplina = val('disciplina');
      if (!centro || !cursoTxt) return err('Centro e Curso são obrigatórios');
      if (!sigla || !disciplina) return err('Sigla e Disciplina são obrigatórias');
      var cursoKey = resolveCourseKey(centro, cursoTxt);
      if (!cursoKey) return err('Curso não reconhecido para "'+centro+' / '+cursoTxt+'"');
      var grade = (normalize(val('grade'))==='2008') ? '2008' : '2023';
      var horariosRaw = val('horarios');
      var sessions = parseHorarios(horariosRaw);
      if (horariosRaw && (!sessions.length || sessions.some(function(s){ return !s; }))) return err('Horário inválido: "'+horariosRaw+'"');
  
      return { ok:true, rowNum:rowNum, record:{
        cursoKey:cursoKey, grade:grade, id: val('id') || null,
        sigla:sigla, nome:disciplina, codigo: val('codigo'), periodo: val('periodo') || '1',
        professor: val('professor'), sala: val('sala') || null, vagas: parseInt(val('vagas'),10) || 0,
        section: normalize(val('secao'))==='pos' ? 'pos' : 'regular',
        sessions: sessions
      }};
    }
  
    function findExisting(cursoKey, record){
      var dataset = (window.BUSSOLA_DATASETS && window.BUSSOLA_DATASETS[cursoKey]) || [];
      if (window.BussolaStore) dataset = BussolaStore.apply(cursoKey, dataset);
      if (record.id){
        var byId = dataset.filter(function(r){ return String(r.id)===String(record.id); });
        if (byId.length) return byId[0];
      }
      var bySigla = dataset.filter(function(r){
        var c = record.grade==='2008' ? r.curr2008 : r.curr2023;
        return c && normalize(c.sigla)===normalize(record.sigla);
      });
      return bySigla.length ? bySigla[0] : null;
    }
  
    function toSessionObjs(sessions){
      return sessions.map(function(s){ return { day_num:s.day_num, day_label:H.DAY_FULL[s.day_num], day_short:H.DAY_SHORT[s.day_num], hour:s.hour }; });
    }
  
    function applyRow(record){
      var existing = findExisting(record.cursoKey, record);
      if (existing){
        var patch = { professor: record.professor, sala: record.sala, vagas: record.vagas, section: record.section };
        if (record.sessions.length) patch.sessions = toSessionObjs(record.sessions);
        H.saveOverride(existing.id, patch);
        return 'atualizada';
      }
      var curr = { nome:record.nome, sigla:record.sigla, codigo:record.codigo, periodo:record.periodo };
      window.BussolaStore.addRecord(record.cursoKey, {
        curr2008: record.grade==='2008' ? curr : null,
        curr2023: record.grade==='2023' ? curr : null,
        professor: record.professor, sala: record.sala, vagas: record.vagas, section: record.section,
        sessions: toSessionObjs(record.sessions)
      });
      return 'criada';
    }
  
    /* ============================================================
       UI
       ============================================================ */
    function downloadTemplate(){
      var header = 'Centro,Curso,Sigla,Disciplina,Codigo,Periodo,Grade,Professor,Sala,Vagas,Secao,Horarios';
      var ex1 = 'CCET,BSI,BD1,Banco de Dados I,BSI0501,5,2023,Prof. Exemplo,Sala 212,40,regular,"SEG 14:00 | QUA 14:00"';
      var ex2 = 'IBIO,Ciências Biológicas - Bacharelado,ECO2,Ecologia II,BIO0220,4,2023,Profa. Exemplo,Lab. 2,35,regular,"TER 18:00"';
      var blob = new Blob([header+'\n'+ex1+'\n'+ex2+'\n'], {type:'text/csv;charset=utf-8'});
      var a = el('a', {href: URL.createObjectURL(blob), download:'bussola_modelo.csv'});
      document.body.appendChild(a); a.click(); a.remove();
    }
  
    var parsedRows = []; // último resultado de validação
  
    function draw(){
      root.innerHTML = '';
      root.appendChild(el('div', {class:'section-head'}, [
        el('div', {}, [
          el('h2', {}, ['Atualização de dados por planilha']),
          el('div', {class:'desc'}, ['Caminho oficial para atualizar professores, salas e horários. Suba uma planilha CSV e o sistema organiza e grava os dados nos lugares certos — sobrescrevendo turmas existentes quando necessário.'])
        ])
      ]));
  
      var card = el('div', {class:'csv-card'});
      card.appendChild(el('div', {class:'csv-head'}, [
        el('div', {}, [
          el('h3', {style:'margin:0 0 4px;'}, ['Formato da planilha']),
          el('div', {class:'desc'}, ['As duas primeiras colunas (Centro e Curso) são obrigatórias e dizem ao sistema onde cada linha deve ser gravada. Colunas desconhecidas são ignoradas, então é seguro manter colunas extras da sua própria planilha de controle.'])
        ]),
        (function(){ var b = el('button', {type:'button', class:'csv-template-btn'}, ['⬇ Baixar modelo (.csv)']); b.onclick = downloadTemplate; return b; })()
      ]));
  
      var specTable = el('table', {class:'csv-spec-table'}, [
        el('thead', {}, [el('tr', {}, ['Coluna','Status','Aceita também','Formato / exemplo'].map(function(h){ return el('th',{},[h]); }))]),
        el('tbody', {}, SPEC_ROWS.map(function(r){
          return el('tr', {}, [
            el('td', {}, [r[0]]),
            el('td', {class: r[1].indexOf('Obrigatória')===0 ? 'req':'opt'}, [r[1]]),
            el('td', {}, [r[2]]),
            el('td', {}, [r[3]])
          ]);
        }))
      ]);
      card.appendChild(specTable);
  
      card.appendChild(el('div', {class:'desc', style:'margin-bottom:14px;'}, [
        'Se já existir uma turma com a mesma Sigla (na mesma Grade) dentro do curso informado, os campos Professor, Sala, Vagas, Seção e Horários dessa turma são sobrescritos. Caso contrário, uma turma nova é criada com todos os dados da linha.'
      ]));
  
      var fileInput = el('input', {type:'file', accept:'.csv,text/csv'});
      var drop = el('div', {class:'csv-drop'}, [
        el('div', {}, ['Selecione o arquivo .csv exportado da sua planilha']),
        fileInput
      ]);
      card.appendChild(drop);
  
      var resultsWrap = el('div', {id:'csvResultsWrap'});
      card.appendChild(resultsWrap);
  
      fileInput.addEventListener('change', function(){
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(){
          var rows = parseCSV(String(reader.result||''));
          if (!rows.length){ resultsWrap.innerHTML=''; resultsWrap.appendChild(el('div',{class:'desc'},['Arquivo vazio ou ilegível.'])); return; }
          var map = buildHeaderMap(rows[0]);
          parsedRows = rows.slice(1).map(function(cols, i){ return processRow(cols, map, i+2); });
          renderResults();
        };
        reader.readAsText(file, 'UTF-8');
      });
  
      function renderResults(){
        resultsWrap.innerHTML = '';
        var ok = parsedRows.filter(function(r){ return r.ok; });
        var bad = parsedRows.filter(function(r){ return !r.ok; });
  
        resultsWrap.appendChild(el('div', {class:'csv-summary'}, [
          el('div', {}, [el('div',{class:'n'},[String(parsedRows.length)]), el('div',{class:'lbl'},['linhas lidas'])]),
          el('div', {}, [el('div',{class:'n'},[String(ok.length)]), el('div',{class:'lbl'},['prontas para gravar'])]),
          el('div', {}, [el('div',{class:'n'},[String(bad.length)]), el('div',{class:'lbl'},['com erro (serão ignoradas)'])])
        ]));
  
        var tbody = el('tbody', {});
        parsedRows.forEach(function(r){
          if (r.ok){
            var rec = r.record;
            tbody.appendChild(el('tr', {}, [
              el('td', {}, [String(r.rowNum)]),
              el('td', {}, [el('span',{class:'csv-status-pill ok'},['válida'])]),
              el('td', {}, [rec.cursoKey]),
              el('td', {}, [rec.sigla]),
              el('td', {}, [rec.nome]),
              el('td', {}, [rec.professor||'—']),
              el('td', {}, [rec.sala||'—']),
              el('td', {}, [rec.sessions.map(function(s){ return H.DAY_SHORT[s.day_num]+' '+H.fmtHour(s.hour); }).join(' · ') || '—'])
            ]));
          } else {
            tbody.appendChild(el('tr', {}, [
              el('td', {}, [String(r.rowNum)]),
              el('td', {}, [el('span',{class:'csv-status-pill erro'},['erro'])]),
              el('td', {colspan:'6'}, [r.message])
            ]));
          }
        });
        var previewWrap = el('div', {class:'csv-preview-wrap'}, [
          el('table', {class:'csv-preview-table'}, [
            el('thead', {}, [el('tr', {}, ['Linha','Status','Curso','Sigla','Disciplina','Professor','Sala','Horários'].map(function(h){ return el('th',{},[h]); }))]),
            tbody
          ])
        ]);
        resultsWrap.appendChild(previewWrap);
  
        var applyBtn = el('button', {type:'button', class:'csv-apply-btn'}, ['Aplicar '+ok.length+' alteração(ões)']);
        applyBtn.disabled = !ok.length;
        applyBtn.addEventListener('click', function(){
          var counts = { criada:0, atualizada:0 };
          ok.forEach(function(r){ counts[applyRow(r.record)]++; });
          var note = el('div', {class:'edit-saved-note'}, [
            counts.criada+' turma(s) criada(s) e '+counts.atualizada+' atualizada(s). Recarregando para aplicar ao curso atual…'
          ]);
          resultsWrap.appendChild(note);
          setTimeout(function(){ BussolaStore.refresh(); }, 900);
        });
        resultsWrap.appendChild(applyBtn);
      }
  
      root.appendChild(card);
    }
  
    document.querySelector('[data-tab="csv"]').addEventListener('click', draw);
    draw();
  })();