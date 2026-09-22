(function(){
"use strict";
/* ============================================================
   Bússola — catálogo de cursos
   ============================================================
   BSI tem a grade real e completa (data/horario-data.js, vinda do
   Horário_BSI_2026_2.CSV). IBIO e Engenharia de Produção ainda não
   têm planilha oficial integrada: as duas entram como VERSÃO DE
   ESCOPO — poucas disciplinas de exemplo, só para validar que o
   mesmo painel funciona com outro curso plugado depois. Quando a
   planilha oficial desses cursos existir, basta gerar um array no
   mesmo formato do horario-data.js e trocar aqui embaixo.
   ============================================================ */

window.BUSSOLA_COURSES = {
  bsi: {
    id:'bsi', sigla:'BSI', nome:'Sistemas de Informação',
    unidade:'CCET', status:'completo',
    descricao:'Grade completa do semestre 2026/2.'
  },
  ibio: {
    id:'ibio', sigla:'IBIO', nome:'Instituto de Biociências',
    unidade:'Ciências Biológicas · Ciências da Natureza · Ciências Ambientais',
    status:'escopo',
    descricao:'Versão de escopo — disciplinas de exemplo, grade oficial ainda não integrada.'
  },
  eng: {
    id:'eng', sigla:'ENG', nome:'Engenharia de Produção',
    unidade:'CCET', status:'escopo',
    descricao:'Versão de escopo — disciplinas de exemplo, grade oficial ainda não integrada.'
  }
};

/* mesmo formato de objeto usado em data/horario-data.js: cada item é
   uma "aula" (horário + sala + professor), com curr2008/curr2023 —
   os cursos de escopo só preenchem curr2023, já que não têm grade
   antiga. */
window.BUSSOLA_DATASETS = {
  bsi: window.BSI_DATA || [],
  ibio: [
    { id:9001, curr2008:null, curr2023:{ nome:'Biologia Celular', sigla:'BIOCEL', codigo:'IBI0101', periodo:'1' },
      professor:'Prof. Exemplo', sala:'Lab. Bio 1', vagas:30, section:'regular',
      sessions:[ {day_num:1,day_label:'Segunda-feira',day_short:'SEG',hour:8}, {day_num:3,day_label:'Quarta-feira',day_short:'QUA',hour:8} ] },
    { id:9002, curr2008:null, curr2023:{ nome:'Química Geral', sigla:'QGERAL', codigo:'IBI0102', periodo:'1' },
      professor:'Profa. Exemplo', sala:'Lab. Química', vagas:28, section:'regular',
      sessions:[ {day_num:2,day_label:'Terça-feira',day_short:'TER',hour:14} ] },
    { id:9003, curr2008:null, curr2023:{ nome:'Ecologia e Meio Ambiente', sigla:'ECOAMB', codigo:'IBI0201', periodo:'2' },
      professor:'Prof. Exemplo', sala:'Sala 301', vagas:35, section:'regular',
      sessions:[ {day_num:4,day_label:'Quinta-feira',day_short:'QUI',hour:16} ] },
    { id:9004, curr2008:null, curr2023:{ nome:'Ciências da Natureza I', sigla:'CNAT1', codigo:'IBI0110', periodo:'1' },
      professor:'Profa. Exemplo', sala:'Sala 118', vagas:32, section:'regular',
      sessions:[ {day_num:5,day_label:'Sexta-feira',day_short:'SEX',hour:14} ] }
  ],
  eng: [
    { id:9101, curr2008:null, curr2023:{ nome:'Introdução à Engenharia de Produção', sigla:'INTRPROD', codigo:'ENG0101', periodo:'1' },
      professor:'Prof. Exemplo', sala:'Sala 210', vagas:40, section:'regular',
      sessions:[ {day_num:1,day_label:'Segunda-feira',day_short:'SEG',hour:14}, {day_num:3,day_label:'Quarta-feira',day_short:'QUA',hour:14} ] },
    { id:9102, curr2008:null, curr2023:{ nome:'Pesquisa Operacional', sigla:'PESQOP', codigo:'ENG0205', periodo:'2' },
      professor:'Profa. Exemplo', sala:'Sala 118', vagas:32, section:'regular',
      sessions:[ {day_num:5,day_label:'Sexta-feira',day_short:'SEX',hour:18} ] },
    { id:9103, curr2008:null, curr2023:{ nome:'Gestão da Qualidade', sigla:'GESTQ', codigo:'ENG0210', periodo:'3' },
      professor:'Prof. Exemplo', sala:'Sala 105', vagas:36, section:'regular',
      sessions:[ {day_num:2,day_label:'Terça-feira',day_short:'TER',hour:16} ] }
  ]
};
})();
