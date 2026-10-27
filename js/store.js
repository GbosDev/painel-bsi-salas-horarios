(function(){
  "use strict";
  /* Camada de dados com persistência local por curso. Trocar por API = reimplementar load/save. */
  var idSeq = Date.now();
  function nextId(){ idSeq += 1; return idSeq; }
  function key(c){ return 'bussola_store_'+c; }
  function load(c){ try{ return Object.assign({added:[],deleted:[],rooms:{added:[],removed:[]}},JSON.parse(localStorage.getItem(key(c)))||{}); }catch(e){ return {added:[],deleted:[],rooms:{added:[],removed:[]}}; } }
  function save(c,d){ localStorage.setItem(key(c),JSON.stringify(d)); localStorage.setItem('bussola_rev',String(Date.now())); }
  function apply(c,base){ var d=load(c); return base.filter(function(r){return d.deleted.indexOf(r.id)<0;}).concat(d.added); }
  function mergeRooms(c,arr){ var d=load(c);
    d.rooms.added.forEach(function(r){ if(arr.indexOf(r)<0) arr.push(r); });
    d.rooms.removed.forEach(function(r){ var i=arr.indexOf(r); if(i>=0) arr.splice(i,1); }); }
  /* nextId() evita colisão de ID quando vários registros são criados no mesmo
     laço síncrono (ex.: importação de CSV com várias linhas) — Date.now()
     isolado podia repetir o mesmo milissegundo para duas turmas. */
  function addRecord(c,rec){ var d=load(c); rec.id=nextId(); d.added.push(rec); save(c,d); return rec.id; }
  function removeRecord(c,id){ var d=load(c); var n=d.added.length; d.added=d.added.filter(function(r){return r.id!==id;}); if(d.added.length===n) d.deleted.push(id); save(c,d);
    try{ var o=JSON.parse(localStorage.getItem('bussola_overrides_'+c))||{}; delete o[id]; localStorage.setItem('bussola_overrides_'+c,JSON.stringify(o)); }catch(e){} }
  function addRoom(c,name){ var d=load(c); d.rooms.removed=d.rooms.removed.filter(function(r){return r!==name;}); if(d.rooms.added.indexOf(name)<0) d.rooms.added.push(name); save(c,d); }
  function removeRoom(c,name){ var d=load(c); d.rooms.added=d.rooms.added.filter(function(r){return r!==name;}); if(d.rooms.removed.indexOf(name)<0) d.rooms.removed.push(name); save(c,d); }
  function refresh(){ location.reload(); }
  window.addEventListener('storage',function(e){ if(e.key&&/^bussola_(store|overrides|audit)/.test(e.key)) location.reload(); });
  window.BussolaStore={apply:apply,mergeRooms:mergeRooms,addRecord:addRecord,removeRecord:removeRecord,addRoom:addRoom,removeRoom:removeRoom,refresh:refresh};
  })();
  