// Executado automaticamente pelo container mongo na primeira inicialização
// (docker-entrypoint-initdb.d). Cria as coleções não-relacionais com uma
// amostra inicial — ementas (syllabus), planos de estudo e log de auditoria.

db = db.getSiblingDB('bussola');

db.createCollection('syllabus');
db.syllabus.insertMany([
  {
    _id: 'BSI001',
    nome: 'Algoritmos e Programação I',
    ementa: 'Introdução à lógica de programação, estruturas de controle, ' +
            'tipos de dados, vetores e matrizes, e desenvolvimento de ' +
            'algoritmos para resolução de problemas computacionais.'
  },
  {
    _id: 'BSI014',
    nome: 'Banco de Dados I',
    ementa: 'Modelagem conceitual e lógica de dados, álgebra relacional, ' +
            'SQL, normalização e projeto de bancos de dados relacionais.'
  },
  {
    _id: 'BSI027',
    nome: 'Engenharia de Software II',
    ementa: 'Processos de desenvolvimento de software, arquitetura de ' +
            'sistemas, padrões de projeto, testes e qualidade de software.'
  }
]);

db.createCollection('study_plan');
db.study_plan.createIndex({ userId: 1, courseId: 1 }, { unique: true });

db.createCollection('audit_log');
db.audit_log.createIndex({ classSessionId: 1 });
db.audit_log.createIndex({ occurredAt: -1 });

print('Bússola: coleções MongoDB inicializadas (syllabus, study_plan, audit_log).');
