(function () {
  "use strict";
  var B = window.__BUSSOLA__, H = window.__b_helpers, el = H.el, root = document.getElementById('view-plano');
  if (!root || B.IS_PROFESSOR || !B.SESSION) return;
  var KEY = 'bussola_plan_' + B.SESSION.user + '_' + B.CURSO, RECS = B.RECORDS, q = '';
  function get() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  var saved = get(), sel = saved.slice();
  var COLORS = ['#3D8577', '#7C5A72', '#B97A22', '#B65C4A', '#445374', '#2A5F55', '#5C4155'];
  function nm(r) { return r.curr2023 || r.curr2008 || {}; }
  function byId(id) { return RECS.filter(function (r) { return r.id === id; })[0]; }
  function chosen(list) { return list.map(byId).filter(Boolean); }
  function busy(room, d, h) { return RECS.some(function (r) { return r.sala === room && r.sessions.some(function (s) { return s.day_num === d && s.hour === h; }); }); }
  function conflicts(list) { var m = {}, c = {}; chosen(list).forEach(function (r) { r.sessions.forEach(function (s) { var k = s.day_num + '-' + s.hour; if (m[k] && m[k] !== r.id) { c[k] = 1; } m[k] = r.id; }); }); return c; }
  function draw() {
    var cf = conflicts(sel), dirty = JSON.stringify(sel) !== JSON.stringify(saved);
    root.innerHTML = '';
    root.appendChild(el('div', { class: 'section-head' }, [el('div', {}, [el('h2', {}, ['Meu plano de aulas']), el('div', { class: 'desc' }, ['Escolha as turmas em que você está inscrito. O painel monta a semana, mostra as salas e avisa sobre choques de horário.'])])]));
    var cat = el('div', { class: 'pl-cat' }), search = el('input', { type: 'text', placeholder: 'Filtrar por sigla, disciplina ou professor', value: q });
    search.addEventListener('input', function () { q = search.value; list(); });
    var ul = el('div', { class: 'pl-list' });
    function list() {
      ul.innerHTML = ''; var t = q.toLowerCase();
      RECS.filter(function (r) { var n = nm(r); return !t || (n.sigla + ' ' + n.nome + ' ' + (r.professor || '')).toLowerCase().indexOf(t) >= 0; }).forEach(function (r) {
        var n = nm(r), on = sel.indexOf(r.id) >= 0;
        var b = el('button', { type: 'button', class: 'pl-item' + (on ? ' on' : '') }, [el('b', {}, [n.sigla || '—']), el('span', {}, [n.nome || '']), el('small', {}, [(r.professor || '') + ' · ' + (r.sala || 'sem sala') + ' · ' + r.sessions.map(function (s) { return s.day_short + ' ' + H.fmtHour(s.hour); }).join(', ')])]);
        b.addEventListener('click', function () { sel = on ? sel.filter(function (i) { return i !== r.id; }) : sel.concat(r.id); draw(); });
        ul.appendChild(b);
      });
    }
    list(); cat.appendChild(search); cat.appendChild(ul);
    var grid = el('div', { class: 'pl-grid' }); grid.appendChild(el('div', {}));
    H.DAY_ORDER.forEach(function (d) { grid.appendChild(el('div', { class: 'pl-dh' }, [H.DAY_SHORT[d]])); });
    var picks = chosen(sel);
    H.HOURS.forEach(function (h) {
      grid.appendChild(el('div', { class: 'pl-hh' }, [H.fmtHour(h)]));
      H.DAY_ORDER.forEach(function (d) {
        var cell = el('div', { class: 'pl-cell' + (cf[d + '-' + h] ? ' clash' : '') });
        picks.forEach(function (r, i) {
          if (r.sessions.some(function (s) { return s.day_num === d && s.hour === h; })) {
            var n = nm(r); cell.appendChild(el('div', { class: 'pl-block', style: 'background:' + COLORS[sel.indexOf(r.id) % COLORS.length] }, [el('b', {}, [n.sigla]), el('span', {}, [r.sala || 'sem sala'])]));
          }
        });
        grid.appendChild(cell);
      });
    });
    var bar = el('div', { class: 'pl-bar' }, [el('span', {}, [picks.length + ' turma(s) · ' + Object.keys(cf).length + ' choque(s)'])]);
    var sv = el('button', { type: 'button', class: 'edit-save-btn' }, [dirty ? 'Salvar plano' : 'Plano salvo']); sv.disabled = !dirty;
    sv.addEventListener('click', function () { localStorage.setItem(KEY, JSON.stringify(sel)); saved = sel.slice(); draw(); });
    bar.appendChild(sv);
    var left = el('div', { class: 'pl-main' }, [bar, el('div', { class: 'pl-gridwrap' }, [grid])]);
    root.appendChild(el('div', { class: 'pl-layout' }, [cat, left]));
    var ag = el('div', { class: 'pl-agenda' }); var sp = chosen(saved);
    ag.appendChild(el('h3', {}, ['Minha semana']));
    if (!sp.length) ag.appendChild(el('div', { class: 'rd-empty' }, ['Salve um plano para ver sua agenda organizada por dia, com sala e ocupação.']));
    H.DAY_ORDER.forEach(function (d) {
      var items = []; sp.forEach(function (r) { r.sessions.forEach(function (s) { if (s.day_num === d) items.push({ r: r, h: s.hour }); }); });
      if (!items.length) return; items.sort(function (a, b) { return a.h - b.h; });
      var col = el('div', { class: 'pl-day' }, [el('h4', {}, [H.DAY_FULL[d]])]);
      items.forEach(function (it) {
        var n = nm(it.r), tot = H.ALL_ROOMS.length, free = H.ALL_ROOMS.filter(function (x) { return !busy(x, d, it.h); }).length;
        col.appendChild(el('div', { class: 'pl-row' }, [el('b', {}, [H.fmtHour(it.h)]), el('div', {}, [el('strong', {}, [n.sigla + ' — ' + n.nome]), el('small', {}, [(it.r.sala || 'sem sala') + ' · ' + (it.r.professor || '') + ' · ' + free + ' de ' + tot + ' salas livres neste horário'])])]));
      });
      ag.appendChild(col);
    });
    root.appendChild(ag);
  }
  document.querySelector('[data-tab="plano"]').addEventListener('click', draw);
  draw();
})();
