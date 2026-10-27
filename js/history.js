(function(){
  "use strict";
  var B=window.__BUSSOLA__, H=window.__b_helpers, el=H.el, root=document.getElementById('view-historico');
  if(!root||!B.IS_PROFESSOR){ return; }

  var TIPO_LABEL = {
    csv_criada: 'CSV · turma criada',
    csv_atualizada: 'CSV · turma atualizada',
    exceptional_edit: 'Excepcional · edição',
    exceptional_create: 'Excepcional · criação',
    exceptional_delete: 'Excepcional · exclusão',
    sala_add: 'Catálogo · sala adicionada',
    sala_remove: 'Catálogo · sala removida'
  };
  var TIPO_CLASS = {
    csv_criada: 'ok', csv_atualizada: 'ok',
    exceptional_edit: 'warn', exceptional_create: 'warn', exceptional_delete: 'erro',
    sala_add: 'ok', sala_remove: 'erro'
  };

  function fmtTs(ts){
    var d = new Date(ts);
    function p(n){ return (n<10?'0':'')+n; }
    return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());
  }
  function fmtFields(obj){
    var keys = Object.keys(obj||{});
    if (!keys.length) return '—';
    return keys.map(function(k){ return k+': '+obj[k]; }).join(' · ');
  }
  function diffLine(entry){
    var antes = entry.antes||{}, depois = entry.depois||{};
    var keys = Object.keys(Object.assign({}, antes, depois));
    if (!keys.length) return '—';
    return keys.map(function(k){
      if (antes[k]!==undefined && depois[k]!==undefined && String(antes[k])!==String(depois[k])) return k+': "'+antes[k]+'" → "'+depois[k]+'"';
      if (depois[k]!==undefined) return k+': '+depois[k];
      if (antes[k]!==undefined) return k+' (removido): '+antes[k];
      return null;
    }).filter(Boolean).join(' · ');
  }

  var filters = { curso:'todos', tipo:'todos', periodo:'30', q:'' };

  function periodoMs(key){
    var day = 24*60*60*1000;
    return { '1':1*day, '7':7*day, '30':30*day, 'tudo':Infinity }[key] || 30*day;
  }

  function draw(){
    root.innerHTML = '';
    root.appendChild(el('div', {class:'section-head'}, [
      el('div', {}, [
        el('h2', {}, ['Histórico de alterações']),
        el('div', {class:'desc'}, ['Quem alterou, o quê e por quê — importações e ajustes excepcionais.'])
      ])
    ]));

    var all = H.getAudit();
    var cursosPresentes = Array.from(new Set(all.map(function(e){ return e.curso; }))).sort();

    var filterBar = el('div', {class:'filter-bar'});
    function field(labelText, node){ return el('div', {class:'filter-field'}, [el('label',{},[labelText]), node]); }

    var cursoSel = el('select', {});
    cursoSel.appendChild(el('option', {value:'todos'}, ['Todos os cursos']));
    cursosPresentes.forEach(function(c){ var o=el('option',{value:c},[c]); if (c===filters.curso) o.selected=true; cursoSel.appendChild(o); });
    cursoSel.value = filters.curso;
    cursoSel.addEventListener('change', function(){ filters.curso = cursoSel.value; renderTable(); });

    var tipoSel = el('select', {});
    tipoSel.appendChild(el('option', {value:'todos'}, ['Todos os tipos']));
    Object.keys(TIPO_LABEL).forEach(function(t){ var o=el('option',{value:t},[TIPO_LABEL[t]]); tipoSel.appendChild(o); });
    tipoSel.addEventListener('change', function(){ filters.tipo = tipoSel.value; renderTable(); });

    var periodoSel = el('select', {});
    [['1','Hoje'],['7','7 dias'],['30','30 dias'],['tudo','Tudo']].forEach(function(p){ var o=el('option',{value:p[0]},[p[1]]); if (p[0]===filters.periodo) o.selected=true; periodoSel.appendChild(o); });
    periodoSel.addEventListener('change', function(){ filters.periodo = periodoSel.value; renderTable(); });

    var qInput = el('input', {type:'text', placeholder:'turma, autor, motivo…'});
    qInput.addEventListener('input', function(){ filters.q = qInput.value; renderTable(); });

    filterBar.appendChild(field('Curso', cursoSel));
    filterBar.appendChild(field('Tipo de alteração', tipoSel));
    filterBar.appendChild(field('Período', periodoSel));
    filterBar.appendChild(field('Buscar', qInput));
    root.appendChild(filterBar);

    var summaryWrap = el('div', {class:'csv-summary', id:'historySummary'});
    root.appendChild(summaryWrap);

    var tableWrap = el('div', {class:'csv-preview-wrap', style:'max-height:none;'});
    root.appendChild(tableWrap);

    function renderTable(){
      var cutoff = Date.now() - periodoMs(filters.periodo);
      var filtered = all.filter(function(e){
        if (filters.curso!=='todos' && e.curso!==filters.curso) return false;
        if (filters.tipo!=='todos' && e.tipo!==filters.tipo) return false;
        if (e.ts < cutoff) return false;
        if (filters.q){
          var q = filters.q.toLowerCase();
          var hay = [e.turmaSigla,e.turmaNome,e.autor,e.motivo,e.cursoNome].filter(Boolean).join(' ').toLowerCase();
          if (hay.indexOf(q)===-1) return false;
        }
        return true;
      });

      var counts = {};
      filtered.forEach(function(e){ counts[e.tipo] = (counts[e.tipo]||0)+1; });
      summaryWrap.innerHTML = '';
      summaryWrap.appendChild(el('div', {}, [el('div',{class:'n'},[String(filtered.length)]), el('div',{class:'lbl'},['alterações no período'])]));
      ['csv_atualizada','csv_criada','exceptional_edit','exceptional_delete'].forEach(function(t){
        if (!counts[t]) return;
        summaryWrap.appendChild(el('div', {}, [el('div',{class:'n'},[String(counts[t])]), el('div',{class:'lbl'},[TIPO_LABEL[t]])]));
      });

      var tbody = el('tbody', {});
      if (!filtered.length){
        tbody.appendChild(el('tr',{},[el('td',{colspan:'7'},[el('div',{class:'empty-state'},['Nenhuma alteração encontrada com esses filtros.'])])]));
      }
      filtered.forEach(function(e){
        tbody.appendChild(el('tr', {}, [
          el('td', {}, [fmtTs(e.ts)]),
          el('td', {}, [el('span',{class:'csv-status-pill '+(TIPO_CLASS[e.tipo]||'ok')},[TIPO_LABEL[e.tipo]||e.tipo])]),
          el('td', {}, [e.cursoNome||e.curso]),
          el('td', {}, [(e.turmaSigla||'—')+' — '+(e.turmaNome||'')]),
          el('td', {}, [e.autor||'—']),
          el('td', {}, [diffLine(e)]),
          el('td', {}, [e.motivo||'—'])
        ]));
      });
      tableWrap.innerHTML = '';
      tableWrap.appendChild(el('table', {class:'csv-preview-table'}, [
        el('thead', {}, [el('tr', {}, ['Data/Hora','Tipo','Curso','Turma','Autor','O que mudou','Motivo'].map(function(h){ return el('th',{},[h]); }))]),
        tbody
      ]));
    }
    renderTable();
  }

  document.querySelector('[data-tab="historico"]').addEventListener('click', draw);
  draw();

  var saved = null; try{ saved = sessionStorage.getItem('bussola_tab'); }catch(e){}
  if (saved && saved !== 'predio'){
    var b = document.querySelector('[data-tab="'+saved+'"]');
    if (b && b.style.display !== 'none') b.click();
  }
})();
