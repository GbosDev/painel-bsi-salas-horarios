(function(){
  "use strict";
  /* Catálogo de cursos. Cursos com "grupo" aparecem agrupados no seletor (ex.: IBIO). */
  window.BUSSOLA_GROUPS = {
    ibio:{ sigla:'IBIO', nome:'Instituto de Biociências', descricao:'Escolha o curso do Instituto de Biociências' }
  };
  window.BUSSOLA_COURSES = {
    bsi:{ id:'bsi', sigla:'BSI', painel:'CCET', nome:'Sistemas de Informação', unidade:'CCET', status:'completo', descricao:'Grade completa do semestre 2026/2.' },
    eng:{ id:'eng', sigla:'ENG', painel:'CCET', nome:'Engenharia de Produção', unidade:'CCET', status:'completo', descricao:'Grade do semestre 2026/2.' },
    mat:{ id:'mat', sigla:'MAT', painel:'CCET', nome:'Licenciatura em Matemática', unidade:'CCET', status:'completo', descricao:'Grade do semestre 2026/2.' },
    'ibio-bcb':{ id:'ibio-bcb', grupo:'ibio', sigla:'CBIO·B', painel:'IBIO', nome:'Ciências Biológicas — Bacharelado', unidade:'IBIO', status:'completo', descricao:'Grade do semestre 2026/2.' },
    'ibio-lcb':{ id:'ibio-lcb', grupo:'ibio', sigla:'CBIO·L', painel:'IBIO', nome:'Ciências Biológicas — Licenciatura', unidade:'IBIO', status:'completo', descricao:'Grade do semestre 2026/2. Salas ainda não informadas.' },
    'ibio-bca':{ id:'ibio-bca', grupo:'ibio', sigla:'CAMB', painel:'IBIO', nome:'Ciências Ambientais — Bacharelado', unidade:'IBIO', status:'completo', descricao:'Grade do semestre 2026/2.' },
    'ibio-lcn':{ id:'ibio-lcn', grupo:'ibio', sigla:'CNAT', painel:'IBIO', nome:'Ciências da Natureza — Licenciatura', unidade:'IBIO', status:'completo', descricao:'Grade do semestre 2026/2.' }
  };
  var IB = window.IBIO_DATA || {};
  window.BUSSOLA_DATASETS = {
    bsi: window.BSI_DATA || [],
    eng: window.ENG_DATA || [],
    mat: window.MAT_DATA || [],
    'ibio-bcb': IB['ibio-bcb'] || [],
    'ibio-lcb': IB['ibio-lcb'] || [],
    'ibio-bca': IB['ibio-bca'] || [],
    'ibio-lcn': IB['ibio-lcn'] || []
  };
  })();
  