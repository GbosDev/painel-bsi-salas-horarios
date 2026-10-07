(function () {
  "use strict";
  /* Catálogo de cursos. Cursos com "grupo" aparecem agrupados no seletor (ex.: IBIO). */
  window.BUSSOLA_GROUPS = {
    ibio: { sigla: 'IBIO', nome: 'Instituto de Biociências', descricao: 'Escolha o curso do Instituto de Biociências' }
  };
  window.BUSSOLA_COURSES = {
    bsi: { id: 'bsi', sigla: 'BSI', painel: 'CCET', nome: 'Sistemas de Informação', unidade: 'CCET', status: 'completo', descricao: 'Grade completa do semestre 2026/2.' },
    eng: { id: 'eng', sigla: 'ENG', painel: 'CCET', nome: 'Engenharia de Produção', unidade: 'CCET', status: 'completo', descricao: 'Grade do semestre 2026/2.' },
    mat: { id: 'mat', sigla: 'MAT', painel: 'CCET', nome: 'Licenciatura em Matemática', unidade: 'CCET', status: 'escopo', descricao: 'Versão de escopo — disciplinas de exemplo, grade oficial ainda não integrada.' },
    'ibio-bcb': { id: 'ibio-bcb', grupo: 'ibio', sigla: 'CBIO·B', painel: 'IBIO', nome: 'Ciências Biológicas — Bacharelado', unidade: 'IBIO', status: 'completo', descricao: 'Grade do semestre 2026/2.' },
    'ibio-lcb': { id: 'ibio-lcb', grupo: 'ibio', sigla: 'CBIO·L', painel: 'IBIO', nome: 'Ciências Biológicas — Licenciatura', unidade: 'IBIO', status: 'completo', descricao: 'Grade do semestre 2026/2. Salas ainda não informadas.' },
    'ibio-bca': { id: 'ibio-bca', grupo: 'ibio', sigla: 'CAMB', painel: 'IBIO', nome: 'Ciências Ambientais — Bacharelado', unidade: 'IBIO', status: 'completo', descricao: 'Grade do semestre 2026/2.' },
    'ibio-lcn': { id: 'ibio-lcn', grupo: 'ibio', sigla: 'CNAT', painel: 'IBIO', nome: 'Ciências da Natureza — Licenciatura', unidade: 'IBIO', status: 'completo', descricao: 'Grade do semestre 2026/2.' }
  };
  function ex(id, nome, sigla, cod, per, prof, sala, vagas, ss) {
    return {
      id: id, curr2008: null, curr2023: { nome: nome, sigla: sigla, codigo: cod, periodo: per }, professor: prof, sala: sala, vagas: vagas, section: 'regular',
      sessions: ss.map(function (s) { var L = { 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira' }, S = { 1: 'SEG', 2: 'TER', 3: 'QUA', 4: 'QUI', 5: 'SEX' }; return { day_num: s[0], day_label: L[s[0]], day_short: S[s[0]], hour: s[1] }; })
    };
  }
  var IB = window.IBIO_DATA || {};
  window.BUSSOLA_DATASETS = {
    bsi: window.BSI_DATA || [],
    eng: window.ENG_DATA || [],
    mat: [
      ex(9201, 'Cálculo I', 'CAL1', 'MAT0101', '1', 'Prof. Exemplo', 'Sala 210', 40, [[1, 18], [1, 19], [3, 18], [3, 19]]),
      ex(9202, 'Geometria Analítica', 'GEOANA', 'MAT0102', '1', 'Profa. Exemplo', 'Sala 211', 40, [[2, 18], [2, 19]]),
      ex(9203, 'Didática da Matemática', 'DIDMAT', 'MAT0210', '3', 'Prof. Exemplo', 'Sala 213', 35, [[4, 20], [4, 21]])
    ],
    'ibio-bcb': IB['ibio-bcb'] || [],
    'ibio-lcb': IB['ibio-lcb'] || [],
    'ibio-bca': IB['ibio-bca'] || [],
    'ibio-lcn': IB['ibio-lcn'] || []
  };
})();
