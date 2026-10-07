(function () {
  "use strict";
  var B = window.__BUSSOLA__, H = window.__b_helpers, el = H.el, root = document.getElementById('view-admin');
  var saved = null; try { saved = sessionStorage.getItem('bussola_tab'); } catch (e) { }
  if (!root || !B.IS_PROFESSOR) { return; }
  var C = B.CURSO, q = '';
  function nm(r) { return r.curr2023 || r.curr2008 || {}; }
  function inUse(room) { return B.RECORDS.filter(function (r) { return r.sala === room; }).length; }
  function sel(opts, val, ph) { var s = el('select', {}); if (ph) s.appendChild(el('option', { value: '' }, [ph])); opts.forEach(function (o) { var op = el('option', { value: String(o[0]) }, [o[1]]); if (String(o[0]) === String(val)) op.selected = true; s.appendChild(op); }); return s; }
  function fld(l, n) { return el('div', { class: 'edit-field' }, [el('label', {}, [l]), n]); }

  /* Criação pontual de uma turma nova — fora do fluxo de importação por CSV. */
  function newTurmaForm() {
    var f = el('div', { class: 'ad-form' }), inp = function (p, t) { return el('input', { type: t || 'text', placeholder: p }); };
    var sigla = inp('Sigla'), nome = inp('Disciplina'), cod = inp('Código'), per = inp('Período'), prof = inp('Professor(a)'), vagas = inp('Vagas', 'number');
    var sala = sel(H.ALL_ROOMS.slice().sort().map(function (r) { return [r, r]; }), '', 'Sem sala fixa'), rows = [[1, H.HOURS[0]]], wrap = el('div', { class: 'edit-sessions' });
    function paint() {
      wrap.innerHTML = ''; rows.forEach(function (s, i) {
        var d = sel(H.DAY_ORDER.map(function (x) { return [x, H.DAY_FULL[x]]; }), s[0]), h = sel(H.HOURS.map(function (x) { return [x, H.fmtHour(x)]; }), s[1]), x = el('button', { type: 'button' }, ['×']);
        d.onchange = function () { s[0] = +d.value; }; h.onchange = function () { s[1] = +h.value; }; x.onclick = function () { rows.splice(i, 1); paint(); }; wrap.appendChild(el('div', { class: 'edit-session-row' }, [d, h, x]));
      });
    }
    paint();
    var add = el('button', { type: 'button', class: 'edit-add-session' }, ['+ adicionar horário']); add.onclick = function () { rows.push([1, H.HOURS[0]]); paint(); };
    var ok = el('button', { type: 'button', class: 'edit-save-btn' }, ['Criar turma']), no = el('button', { type: 'button', class: 'edit-cancel-btn' }, ['Cancelar']), err = el('div', { class: 'auth-error', hidden: true }, ['Informe sigla, disciplina e ao menos um horário.']);
    no.onclick = function () { f.classList.remove('open'); };
    ok.onclick = function () {
      if (!sigla.value.trim() || !nome.value.trim() || !rows.length) { err.hidden = false; return; }
      BussolaStore.addRecord(C, {
        curr2008: null, curr2023: { nome: nome.value.trim(), sigla: sigla.value.trim(), codigo: cod.value.trim(), periodo: per.value.trim() || '1' }, professor: prof.value.trim(), sala: sala.value || null, vagas: +vagas.value || 0, section: 'regular',
        sessions: rows.map(function (s) { return { day_num: s[0], day_label: H.DAY_FULL[s[0]], day_short: H.DAY_SHORT[s[0]], hour: s[1] }; })
      }); BussolaStore.refresh();
    };
    f.appendChild(el('div', { class: 'ad-grid' }, [fld('Sigla', sigla), fld('Disciplina', nome), fld('Código', cod), fld('Período', per), fld('Professor(a)', prof), fld('Vagas', vagas), fld('Sala', sala)]));
    f.appendChild(el('label', { class: 'ad-lbl' }, ['Horários semanais'])); f.appendChild(wrap); f.appendChild(add); f.appendChild(err); f.appendChild(el('div', { class: 'edit-actions' }, [ok, no]));
    return f;
  }

  /* Edição excepcional de uma turma já existente (ex.: troca de sala de
     última hora). Substitui a antiga edição inline do drawer, que foi
     removida — agora essa é a única porta de edição pontual do sistema. */
  function editTurmaForm(rec, onDone) {
    var f = el('div', { class: 'edit-form' });
    var profInput = el('input', { type: 'text', value: rec.professor || '' });
    f.appendChild(fld('Professor(a)', profInput));
    var salaSelect = sel(H.ALL_ROOMS.slice().sort().map(function (r) { return [r, r]; }), rec.sala || '', 'sem sala fixa');
    f.appendChild(fld('Sala', salaSelect));
    var vagasInput = el('input', { type: 'number', value: rec.vagas || 0 });
    f.appendChild(fld('Vagas', vagasInput));
    var working = rec.sessions.map(function (s) { return { day_num: s.day_num, hour: s.hour }; }), wrap = el('div', { class: 'edit-sessions' });
    function paint() {
      wrap.innerHTML = ''; working.forEach(function (s, i) {
        var d = sel(H.DAY_ORDER.map(function (x) { return [x, H.DAY_FULL[x]]; }), s.day_num), h = sel(H.HOURS.map(function (x) { return [x, H.fmtHour(x)]; }), s.hour), x = el('button', { type: 'button' }, ['×']);
        d.onchange = function () { s.day_num = +d.value; }; h.onchange = function () { s.hour = +h.value; }; x.onclick = function () { working.splice(i, 1); paint(); }; wrap.appendChild(el('div', { class: 'edit-session-row' }, [d, h, x]));
      });
    }
    paint();
    var add = el('button', { type: 'button', class: 'edit-add-session' }, ['+ adicionar horário']); add.onclick = function () { working.push({ day_num: 1, hour: H.HOURS[0] }); paint(); };
    f.appendChild(el('label', { class: 'ad-lbl' }, ['Horários semanais'])); f.appendChild(wrap); f.appendChild(add);
    var ok = el('button', { type: 'button', class: 'edit-save-btn' }, ['Salvar ajuste excepcional']), no = el('button', { type: 'button', class: 'edit-cancel-btn' }, ['Cancelar']);
    no.onclick = function () { onDone(); };
    ok.onclick = function () {
      H.saveOverride(rec.id, {
        professor: profInput.value.trim(), sala: salaSelect.value || null, vagas: parseInt(vagasInput.value, 10) || 0,
        sessions: working.map(function (s) { return { day_num: s.day_num, day_label: H.DAY_FULL[s.day_num], day_short: H.DAY_SHORT[s.day_num], hour: s.hour }; })
      });
      BussolaStore.refresh();
    };
    f.appendChild(el('div', { class: 'edit-actions' }, [ok, no]));
    return f;
  }

  function draw() {
    root.innerHTML = '';
    root.appendChild(el('div', { class: 'exception-banner' }, [
      el('div', { class: 'exception-banner-title' }, ['⚠ Ferramenta de uso excepcional']),
      el('div', {}, ['Use esta seção só para correções pontuais e urgentes (ex.: troca de sala de última hora por uma prova extra). Para atualizar a grade do semestre, use a aba "Atualizar dados" — ela é o caminho oficial e evita divergência entre turmas.'])
    ]));
    var nf = newTurmaForm(), nb = el('button', { type: 'button', class: 'edit-save-btn' }, ['+ Nova turma (caso excepcional)']); nb.onclick = function () { nf.classList.toggle('open'); };
    root.appendChild(el('div', { class: 'section-head' }, [el('div', {}, [el('h2', {}, ['Ajuste excepcional']), el('div', { class: 'desc' }, ['Crie, edite pontualmente ou remova uma turma específica. Toda alteração aqui também aparece imediatamente para os estudantes.'])]), nb]));
    root.appendChild(nf);
    var editWrap = el('div', { id: 'exceptionEditFormWrap' });
    root.appendChild(editWrap);
    var s = el('input', { type: 'text', placeholder: 'Buscar turma', value: q }); s.oninput = function () { q = s.value; rows(); };
    var tb = el('tbody', {});
    function rows() {
      tb.innerHTML = ''; var t = q.toLowerCase();
      B.RECORDS.filter(function (r) { var n = nm(r); return !t || (n.sigla + ' ' + n.nome + ' ' + (r.professor || '') + ' ' + (r.sala || '')).toLowerCase().indexOf(t) >= 0; }).forEach(function (r) {
        var n = nm(r);
        var e = el('button', { type: 'button', class: 'ad-btn' }, ['Editar']), d = el('button', { type: 'button', class: 'ad-btn danger' }, ['Excluir']);
        e.onclick = function () { editWrap.innerHTML = ''; editWrap.appendChild(editTurmaForm(r, function () { editWrap.innerHTML = ''; })); };
        d.onclick = function () { if (d.dataset.arm) { BussolaStore.removeRecord(C, r.id); BussolaStore.refresh(); } else { d.dataset.arm = 1; d.textContent = 'Confirmar?'; setTimeout(function () { delete d.dataset.arm; d.textContent = 'Excluir'; }, 3000); } };
        tb.appendChild(el('tr', {}, [el('td', {}, [n.sigla || '']), el('td', {}, [n.nome || '']), el('td', {}, [r.professor || '—']), el('td', {}, [r.sala || '—']), el('td', {}, [r.sessions.map(function (x) { return x.day_short + ' ' + H.fmtHour(x.hour); }).join(' · ')]), el('td', { class: 'ad-act' }, [e, d])]));
      });
    }
    rows();
    var th = el('thead', {}, [el('tr', {}, ['Sigla', 'Disciplina', 'Professor', 'Sala', 'Horários', ''].map(function (x) { return el('th', {}, [x]); }))]);
    root.appendChild(el('div', { class: 'ad-card' }, [el('div', { class: 'ad-head' }, [el('h3', {}, ['Turmas']), s]), el('div', { class: 'index-table-wrap' }, [el('table', { class: 'index-table' }, [th, tb])])]));
    var rn = el('input', { type: 'text', placeholder: 'Nova sala (ex.: Sala 301)' }), ra = el('button', { type: 'button', class: 'edit-save-btn' }, ['Adicionar sala']);
    ra.onclick = function () { var v = rn.value.trim(); if (v) { BussolaStore.addRoom(C, v); BussolaStore.refresh(); } };
    var chips = el('div', { class: 'ad-rooms' });
    H.ALL_ROOMS.slice().sort().forEach(function (r) {
      var u = inUse(r), x = el('button', { type: 'button', title: u ? 'Sala em uso por ' + u + ' turma(s)' : 'Remover sala' }, ['×']);
      x.onclick = function () { if (u) { x.parentNode.classList.add('shake'); setTimeout(function () { x.parentNode.classList.remove('shake'); }, 400); return; } BussolaStore.removeRoom(C, r); BussolaStore.refresh(); };
      chips.appendChild(el('span', { class: 'ad-chip' + (u ? ' used' : '') }, [r + (u ? ' · ' + u : ''), x]));
    });
    root.appendChild(el('div', { class: 'ad-card' }, [el('div', { class: 'ad-head' }, [el('h3', {}, ['Salas'])]), el('div', { class: 'ad-add' }, [rn, ra]), chips]));
  }
  document.querySelector('[data-tab="admin"]').addEventListener('click', draw);
  draw();
  if (saved && saved !== 'predio') { var b = document.querySelector('[data-tab="' + saved + '"]'); if (b && b.style.display !== 'none') b.click(); }
})();
