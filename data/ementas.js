/* ============================================================
   EMENTAS — Portal do Ementário / UNIRIO
   Cobre as duas grades do curso de Sistemas de Informação (BSI):
     - RESOLUÇÃO Nº 5661 DE 28/02/2023 (currículo atual, v=737)
     - Resolução Nº 2904 DE 2008/1 (currículo antigo/em extinção, v=339)
   Fontes:
     https://portais.unirio.br/ementario/curriculo.action?v=737
     https://portais.unirio.br/ementario/curriculo.action?v=339
   Estrutura (CSV-like), uma chave por código de disciplina:
     codigo -> { nome, ementa }
   Alguns códigos da grade 2023 (TPS, TQS, PADA, AUTO, STI) tiveram a
   ementa fornecida diretamente pelo usuário, pois o portal não estava
   respondendo a essas páginas específicas no momento da coleta.
   ============================================================ */
window.BSI_EMENTAS = {

  /* ---------- GRADE 2023 (RESOLUÇÃO Nº 5661) ---------- */

  "TIN0206": {
    "nome": "Fundamentos de Sistemas de Informação",
    "ementa": "Sistemas. Empresas. Sistemas de Informação. Tecnologia da Informação. Classificações de Sistemas de Informação. Casos de Sucesso e Fracasso de Sistemas de Informação nas Empresas. Ética em Sistemas de Informação."
  },
  "TIN0207": {
    "nome": "Informação e Sociedade",
    "ementa": "O profissional de computação e informática, interdisciplinaridade e abordagem sociotécnica. A sociedade em rede e a democratização da informação. Responsabilidade social e sustentabilidade. Impactos humanos, ambientais, sociais e econômicos. Ética e legislação em Sistemas de Informação."
  },
  "TIN0208": {
    "nome": "Interação Humano-Computador",
    "ementa": "Conceitos básicos: usabilidade, acessibilidade/inclusão social e comunicabilidade, engenharia semiótica. Abordagens teóricas em IHC. Sistemas centrados no usuário. Avaliação de interfaces: inspeção e observação de usuários. Identificação de necessidades dos usuários e requisitos de IHC. Tópicos relacionados a aspectos humanos de sistemas."
  },
  "TIN0209": {
    "nome": "Projeto Integrador I",
    "ementa": "Elaboração e implementação de projeto aplicando conhecimentos adquiridos utilizando linguagens para novas tecnologias."
  },
  "TIN0210": {
    "nome": "Projeto Integrador II",
    "ementa": "Elaboração e implementação de projeto aplicando conhecimentos adquiridos utilizando modelagem de informação e de sistemas."
  },
  "TIN0211": {
    "nome": "Metodologia Científica e Tecnológica",
    "ementa": "Organização do trabalho científico e tecnológico de pesquisa na área de Sistemas de Informação. A linguagem científica e tecnológica: seus conceitos, ativos e normas básicas. Métodos de levantamento do estado da arte e da técnica. Estratégias para a elaboração da escrita e da investigação científica e tecnológica. Buscas."
  },
  "TIN0218": {
    "nome": "Fundamentos de Gestão Organizacional",
    "ementa": "Fundamentos de Administração. Modelagem organizacional. Comportamento organizacional. Modelos de gestão. Gestão de mudanças. Gestão de pessoas. Gestão da qualidade. Gestão da produção. Gestão de marketing. Gestão de tecnologia da informação. Gestão de risco. Planejamento organizacional. Planejamento estratégico."
  },
  "TIN0219": {
    "nome": "Gestão de Processos de Negócios",
    "ementa": "Organizações e processos. Objetivos da gestão de processos de negócio. Metamodelos de processos. Linguagens e ferramentas para modelagem de processos. Modelagem de Processos. Análise de processos de negócio. Redesenho de processos de negócio. Automação de processos de negócio."
  },
  "TIN0220": {
    "nome": "Governança de Tecnologia da Informação",
    "ementa": "Governança de Tecnologia da Informação. Planejamento estratégico de Tecnologia da Informação. Tipos de Sistemas de Informação. Arquitetura empresarial. Prospecção de tecnologia. Funções de Tecnologia da Informação. Continuidade de negócio. Análise de investimento em Tecnologia da Informação. Gestão de risco em Tecnologia da Informação. Segurança em Tecnologia da Informação."
  },
  "TIN0221": {
    "nome": "Empreendedorismo e Inovação",
    "ementa": "Fundamentos do empreendedorismo. Aspectos comportamentais do empreendedor. O ambiente dos negócios. Idéias e oportunidades de negócios. Atributos de valor. Cadeia de valor. Planejamento, estratégia e riscos. Competitividade. Modelo de negócios. Plano de negócios. Ferramentas de gestão de negócios. Design Thinking. Economia da experiência e do serviço."
  },
  "TIN0222": {
    "nome": "Algoritmos e Programação",
    "ementa": "Introdução à computação. Algoritmos e resolução de problemas. Tipos de dados, variáveis, constantes, expressões e operadores. Entradas e saídas básicas. Controle de fluxo procedimental: sequencial, seleção e repetição. Funções. Vetores e matrizes. Cadeias de caracteres. Desenvolvimento de programas. Depuração e testes."
  },
  "TIN0223": {
    "nome": "Introdução à Lógica Computacional",
    "ementa": "Introdução à linguagem da lógica proposicional e sua relação com a algebra Booleana. Sistemas formais de dedução completos e corretos. Introdução à lógica de primeira ordem. Regras específicas de dedução para lógica. Os princípios da indução e aplicações. Definições e algoritmos recursivos. Princípios e técnicas de contagem combinatórias fundamentais."
  },
  "TIN0224": {
    "nome": "Técnicas de Programação",
    "ementa": "Algoritmos recursivos. Conceitos de programação orientada a objetos. Arquivos. Uso de estruturas de dados básicas da biblioteca padrão (fila, pilha, lista)."
  },
  "TIN0225": {
    "nome": "Estruturas de Dados",
    "ementa": "Noções básicas de complexidade. Listas lineares. Árvores: árvores binárias de busca e árvores balanceadas. Filas de prioridades. Hashing. Aplicações em grafos."
  },
  "TIN0226": {
    "nome": "Linguagens e Paradigmas de Programação",
    "ementa": "Alfabetos e linguagens. Gramáticas. Autômatos finitos e linguagens regulares. Máquinas de pilha e linguagens livres de contexto. Máquinas de Turing. Fundamentos de linguagens de programação. Definição e caracterização dos principais paradigmas de programação: linguagens imperativas, orientadas a objetos, funcionais e lógicas."
  },
  "TIN0227": {
    "nome": "Projeto e Análise de Algoritmos",
    "ementa": "Critérios de análise, correção e eficiência. Complexidade de pior caso e caso médio. Divisão e conquista; Algoritmos gulosos; Programação dinâmica. Modelagem em grafos. Teoria da complexidade: problemas de decisão, transformações polinomiais, classes P, NP, Co-NP e NP-completa."
  },
  "TIN0228": {
    "nome": "Análise e Projeto de Sistemas",
    "ementa": "Orientação a objetos. Especificação de sistemas. Engenharia de requisitos de sistemas. Estudo de viabilidade. Modelagem de sistemas orientada a objetos. Análise e solução de problemas. Estudos de casos."
  },
  "TIN0229": {
    "nome": "Engenharia de Software I",
    "ementa": "Fundamentos de Engenharia de Software. Processos de software. Arquitetura e projeto de sistemas orientados a objetos. Construção de sistemas. Qualidade e manutenção de sistemas. Aplicações no desenvolvimento de um projeto de software."
  },
  "TIN0230": {
    "nome": "Engenharia de Software II",
    "ementa": "Sistemas de controle de versão. Sistemas de recuperação de dependências e de construção de software. Estilos de programação. Revisões e inspeções. Técnicas e estratégias de teste de software. Testes de unidade. Testes de integração. Integração de programas. Princípios de projeto de sistemas. Módulos, interfaces, acoplamento. Padrões de projeto. Tratamento de exceções."
  },
  "TIN0231": {
    "nome": "Gerência de Projetos",
    "ementa": "Conceitos de projeto e gerência de projetos. Processos da gerência de projetos. Planejamento de projetos. Plano de projeto. Acompanhamento de projetos. Finalização de projetos. Projetos de Tecnologia da Informação."
  },
  "TIN0232": {
    "nome": "Modelagem da Informação",
    "ementa": "Visão geral de dados, informação e conhecimento. Modelos de abstração de dados. Processo de modelagem de dados e informação. Projeto lógico de modelos de dados. Metodologias de construção de modelos de dados. Estudos de casos."
  },
  "TIN0233": {
    "nome": "Armazenamento e Gestão de Dados",
    "ementa": "Estruturas de armazenamento e organização de dados. Tecnologias e arquiteturas de bancos de dados. Sistemas gerenciadores de bancos de dados. Sistemas de gerenciamento de bancos de dados distribuídos. Tecnologias de big data. Projeto físico de armazenamento e gestão de dados. Estudos de caso."
  },
  "TIN0234": {
    "nome": "Ciência de Dados",
    "ementa": "O pensamento analítico baseado em dados. Problemas de negócio e soluções de ciência de dados. Modelos analíticos (exploratório, descritivo, diagnóstico, preditivo, prescritivo). Decisão orientada por dados analíticos. Engenharia orientada por dados analíticos. Ciência de dados e estratégias de negócio. Aplicações."
  },
  "TIN0235": {
    "nome": "Arquitetura de Computadores",
    "ementa": "Histórico do desenvolvimento de computadores. Princípios e componentes. Funcionamento da UCP, memória e dispositivos de entrada/saída."
  },
  "TIN0236": {
    "nome": "Sistemas Operacionais",
    "ementa": "Histórico do desenvolvimento dos sistemas operacionais. Princípios e componentes. Chamadas de sistema. Gerenciamento de processos e threads. Gerenciamento de memória: paginação e segmentação. Gerenciamento de entrada/saída: dispositivos em bloco e caractere. Sistemas de arquivos. Virtualização."
  },
  "TIN0237": {
    "nome": "Redes de Computadores",
    "ementa": "Redes de computadores e Internet. Protocolos. Tecnologias de redes. Arquitetura TCP/IP. Serviços e protocolos das camadas TCP/IP."
  },
  "TIN0238": {
    "nome": "Acessibilidade",
    "ementa": "Conceitos básicos. Perfis de usuários. Visão. Audição. Analfabetismo funcional. Terceira idade. Deficiência física/motora. Avaliação de interfaces. Acessibilização. Navegação acessível. Conteúdo acessível. Entrada de dados acessível."
  },
  "TIN0239": {
    "nome": "Cibercultura",
    "ementa": "Pensamento interdisciplinar. Cibercultura e web na Sociedade. Web 2.0 e software social. Cibercultura, tecnologia e vida social na cultura contemporânea. Tecnologias da Informação e a web como ciência. Governança na Internet (incluindo ética, privacidade e confiabilidade na web). Teorias da cibercultura."
  },
  "TIN0240": {
    "nome": "Ciência de Redes",
    "ementa": "Fundamentos de ciência de redes. Tipos de redes reais. Caracterização estrutural de redes. Fenômenos em redes: efeito mundo pequeno, redes livres de escala, clusterização, comunidades. Modelos aleatórios de redes: Erdos–Rényi, Barabási–Albert, Watts–Strogatz. Processos sobre redes. Redes temporais. Aplicações."
  },
  "TIN0247": {
    "nome": "Tópicos em Informática na Educação",
    "ementa": "Tópicos selecionados sobre o estado da arte e/ou técnica de Informática na Educação. Entre eles tem-se: Teorias de Aprendizagem e Métodos Educacionais; Sistemas computacionais voltados para a educação; Educação a Distância (EAD) e Redes Sociais. Modelagem de Competências. Métodos de avaliação e definição de currículos orientados por competências; Gamificação."
  },
  "TIN0250": {
    "nome": "Tópicos em Inovação Tecnológica",
    "ementa": "Tópicos selecionados sobre o estado da arte/técnica em Inovação Tecnológica."
  },
  "TIN0252": {
    "nome": "Algoritmos para Ciência de Dados",
    "ementa": "Aspectos importantes ao lidar com dados. Dados em altas dimensões. Representação de dados em dimensões menores. Algoritmos para streams de dados. Busca de itens similares. Modelos de aprendizagem de máquina."
  },
  "TIN0255": {
    "nome": "Aprendizagem Profunda",
    "ementa": "Apresentação das principais arquiteturas de aprendizagem profunda (deep learning). Redes neurais feedforward. Redes neurais convolucionais. Máquina restrita de Boltzmann. Redes recorrentes. Autoencoder. Redes generativas adversariais. Aprendizado por reforço. Aplicações a problemas de diversas áreas."
  },
  "TIN0257": {
    "nome": "Estruturas Discretas com Algoritmos",
    "ementa": "Princípios de aritmética modular. Introdução a grafos, principais conceitos e algoritmos fundamentais."
  },
  "TIN0260": {
    "nome": "Heurísticas Inteligentes: Técnicas e Aplicações",
    "ementa": "Revisão sobre teoria da complexidade. Estudo de alguns problemas clássicos de otimização combinatória NP-Completos ou NP-Difíceis, tais como, por exemplo, satisfatibilidade, caixeiro viajante, agrupamento de módulos de software, recobrimento de conjuntos, empacotamento de objetos, entre outros. Estudo de métodos heurísticos para problemas de otimização combinatória difíceis, como, por exemplo, métodos construtivos, algoritmos aproximativos, busca local e metaheurísticas. Aplicações. Experimento computacional com heurísticas."
  },
  "TIN0306": {
    "nome": "Atividades de Extensão I",
    "ementa": "Disciplina para validação de creditação de atividades de extensão através da participação em programas/projetos de extensão."
  },
  "TIN0307": {
    "nome": "Atividades de Extensão II",
    "ementa": "Disciplina para validação de creditação de atividades de extensão através da participação em programas/projetos de extensão."
  },
  "TIN0308": {
    "nome": "Projeto de Graduação I",
    "ementa": "Orientação para a escolha do tema para o desenvolvimento do Projeto de Graduação e escrita da monografia. Elaboração de uma proposta de trabalho de final de curso com a definição de um professor orientador."
  },
  "TIN0309": {
    "nome": "Projeto de Graduação II",
    "ementa": "Implementação do projeto formulado em Projeto de Graduação I. Elaboração de uma monografia e apresentação oral do trabalho a uma banca examinadora."
  },
  "TMT0043": {
    "nome": "Fundamentos de Cálculo",
    "ementa": "Teoria dos Conjuntos, relações e funções. Função do 1º grau, função do 2º grau, função modular. Composição de funções e função inversa. Função exponencial e função logarítmica. Funções trigonométricas. Números inteiros e divisibilidade. Aplicações em Sistemas de Informação."
  },
  "TMT0044": {
    "nome": "Álgebra Linear",
    "ementa": "Sistemas de equações lineares. Determinantes. Matrizes. Subespaços vetoriais Euclidianos. Transformações lineares. Autovalores e autovetores; diagonalização. Produto interno."
  },
  "TMT0045": {
    "nome": "Cálculo Diferencial e Integral I",
    "ementa": "Limites e continuidade. Definição de derivada. Aplicações das derivadas. Integral indefinida e aplicações. Integral Definida e aplicações. Teorema Fundamental do Cálculo e aplicações. Aplicações em Sistemas de Informação."
  },
  "TMT0046": {
    "nome": "Cálculo Diferencial e Integral II",
    "ementa": "Técnicas de integração. Aplicações da integral. Funções de várias variáveis: limites, continuidade e diferenciabilidade. Gradiente, Regra da Cadeia, Teorema do Valor Médio. Derivadas parciais de ordem superior e Teorema de Schwarz. Máximos e mínimos de funções de várias variáveis."
  },
  "TMQ0007": {
    "nome": "Probabilidade",
    "ementa": "Revisão de análise combinatória. Axiomas de Kolmogorov. Probabilidade condicional. Variáveis aleatórias discretas e contínuas: principais distribuições, valor esperado e variância. Noção de Teorema Central do Limite. Aplicações em Sistemas de Informação."
  },
  "TMQ0008": {
    "nome": "Estatística",
    "ementa": "Planejamento de pesquisa. Análise exploratória de dados. Noções de amostragem. Inferência estatística: métodos paramétricos e não-paramétricos. Noções de modelos lineares normal e logístico. Aplicações em Sistemas de Informação."
  },
  "TIN0285": {
    "nome": "Tópicos em Projeto de Software",
    "ementa": "Tópicos selecionados sobre o estado da arte e prática em projeto de software no desenvolvimento de sistemas de informação."
  },
  "TIN0286": {
    "nome": "Tópicos em Qualidade de Software",
    "ementa": "Tópicos selecionados sobre o estado da arte e prática em qualidade de software no desenvolvimento de sistemas de informação."
  },
  "TIN0291": {
    "nome": "Projeto de Aplicações com Dados Abertos",
    "ementa": "Dados Abertos: visão geral, importância e uso. Portais de dados abertos. Transparência digital. Ferramentas para construção de sistemas de inteligência de negócios. Desenvolvimento de software com uso de dados abertos."
  },
  "TIN0297": {
    "nome": "Automação",
    "ementa": "Automação, Robótica Básica e Internet das Coisas."
  },
  "TIN0302": {
    "nome": "Segurança de Tecnologia da Informação",
    "ementa": "Conceitos básicos de segurança. Segurança nas camadas de aplicação, transporte e rede. Segurança em redes sem fio. Ataques e contramedidas. Segurança de redes e serviços."
  },

  /* ---------- GRADE 2008 (Resolução Nº 2904, em extinção) ---------- */

  "TIN0011": {
    "nome": "Técnicas de Programação II",
    "ementa": "Tipos de dados compostos. Ponteiros. Implementação das estruturas de dados básicas (listas, filas e pilhas). Registros e arquivos. Algoritmos recursivos."
  },
  "TIN0013": {
    "nome": "Análise Empresarial e Administrativa",
    "ementa": "Administração: conceito, definição, evolução. Campo de atuação da Administração. Funções administrativas: planejamento, organização, coordenação e controle. Funções empresariais: marketing, produção, finanças e recursos humanos. Administração e desenvolvimento interpessoal e gerencial. Liderança e motivação."
  },
  "TIN0054": {
    "nome": "Atividades Curriculares de Extensão-1",
    "ementa": "Atividades de extensão universitária, compreendendo: ações comunitárias, estágios internos e externos, participação em projetos de extensão, e outras modalidades de formação complementar apresentadas na Resolução Nº 2628, de 08.09.05, que dispõe sobre a regulamentação das Atividades Complementares nos currículos dos Cursos de Graduação da UNIRIO."
  },
  "TIN0055": {
    "nome": "Atividades Curriculares de Extensão-2",
    "ementa": "Alunos matriculados nessas disciplinas desempenharão atividades de extensão universitária, compreendendo: ações comunitárias, estágios internos e externos supervisionados por professores, participação em projetos de extensão que conjuguem interesses e necessidades da comunidade."
  },
  "TIN0056": {
    "nome": "Atividades Curriculares de Extensão-3",
    "ementa": "Alunos matriculados nessas disciplinas desempenharão atividades de extensão universitária, compreendendo: ações comunitárias, estágios internos e externos supervisionados por professores, participação em projetos de extensão que conjuguem interesses e necessidades da comunidade."
  },
  "TIN0057": {
    "nome": "Atividades Curriculares de Extensão-4",
    "ementa": "Alunos matriculados nessas disciplinas desempenharão atividades de extensão universitária, compreendendo: ações comunitárias, estágios internos e externos supervisionados por professores, participação em projetos de extensão que conjuguem interesses e necessidades da comunidade."
  },
  "TIN0105": {
    "nome": "Introdução à Lógica Computacional",
    "ementa": "Lógica proposicional e álgebra booleana. Lógica de predicados. Indução. Recursão."
  },
  "TIN0107": {
    "nome": "Técnicas de Programação-I",
    "ementa": "O conceito de algoritmo. Princípios de programação estruturada. Conceitos básicos de uma linguagem de programação. Recursividade. Vetores e matrizes. Algoritmos de ordenação. Pesquisa seqüencial e binária."
  },
  "TIN0108": {
    "nome": "Organização de Computadores",
    "ementa": "Histórico do desenvolvimento de Computadores. Princípios e Componentes. Funcionamento da UCP, Memória e Dispositivos de Entrada/Saída. Portas Lógicas – construção de uma Unidade Lógica Aritmética."
  },
  "TIN0109": {
    "nome": "Estruturas Discretas",
    "ementa": "Relações Binárias: Conceitos e Propriedades. Aritmética Modular. Noções de Teoria de grafos: isomorfismo, planaridade, coloração, conectividade, propriedades de árvores."
  },
  "TIN0110": {
    "nome": "Interação Humano-Computador",
    "ementa": "Conceitos Básicos, Sistemas centrados no usuário, Requisitos não Funcionais de Usabilidade, Globalização, Projetos de Sites."
  },
  "TIN0112": {
    "nome": "Fundamentos de Sistemas de Informação",
    "ementa": "Introdução a Sistemas de Informação; Sistemas de Informação na Empresa; Infraestrutura da Tecnologia de Informação; Desenvolvimento de Sistemas de Informação e Paradigmas de Modelagem de Sistemas."
  },
  "TIN0114": {
    "nome": "Estruturas de Dados-I",
    "ementa": "Revisão de Abstração de Dados e Programação Orientada a Objetos. Estruturas de Arquivos. Pilhas, filas e listas encadeadas. Heaps e filas de prioridade. Conjuntos. Árvores binárias e de grau N. Árvores binárias de busca."
  },
  "TIN0115": {
    "nome": "Análise de Sistemas",
    "ementa": "O projeto de sistemas de informação no ciclo de desenvolvimento. Projeto funcional: modularização do sistema, definição de programas. Projeto de dados: normalização, projeto de arquivos. Projeto de interfaces: interface homem-máquina, projeto de telas e relatórios. Documentação técnica. Estudos de casos."
  },
  "TIN0116": {
    "nome": "Sistemas Operacionais",
    "ementa": "Histórico do desenvolvimento dos Sistema Operacionais. Princípios e Componentes. Processos e seu gerenciamento do processador. Memória e seu gerenciamento – paginação e segmentação. Entrada/Saída e seu gerenciamento – dispositivos em bloco e caractere. Sistemas de Arquivos e seu gerenciamento."
  },
  "TIN0118": {
    "nome": "Análise de Algoritmos",
    "ementa": "Critérios de análise, correção e eficiência. Análise de algoritmos: tempo de processamento e número de operações elementares, complexidade de pior caso. Algoritmos e estruturas de dados para problemas em grafos. Teoria da Complexidade: problemas de decisão, transformações polinomiais, classe P, algoritmos não determinísticos, classes NP e NP-completa."
  },
  "TIN0119": {
    "nome": "Linguagens Formais e Autômatos",
    "ementa": "Hierarquia de Chomsky. Alfabetos e linguagens. Gramáticas. Autômatos finitos e linguagens regulares; máquinas de pilha e linguagens livres de contexto, gramáticas LL(k) e LR(k); gramáticas sensíveis a contexto. Máquinas de Turing. Capacidade e limite de cada classe. Decidibilidade e Computabilidade."
  },
  "TIN0120": {
    "nome": "Banco de Dados-I",
    "ementa": "Conceitos básicos sobre Bancos de Dados e Sistemas de Gerência de Banco de Dados. Modelo Entidade-Relacionamento e Modelagem de Dados com UML. Modelo relacional. Álgebra relacional e SQL. Restrições de integridade e visões. Dependências Funcionais e Formas Normais. Projeto de bancos de dados relacionais."
  },
  "TIN0121": {
    "nome": "Programação Modular",
    "ementa": "Estilos de programação. Processo de desenvolvimento de programas modulares. Princípios de programação modular. Módulos, interfaces, acoplamento. Ferramentas para programação modular. Tipos abstratos de dados. Conceitos de orientação a objetos. Princípios de projeto de sistemas. Padrões de projeto. Tratamento de exceções. Revisões e Inspeções. Técnicas e estratégias de teste de software. Testes de unidade. Testes de integração. Integração de programas. Gerência de Configuração de Software."
  },
  "TIN0122": {
    "nome": "Processos de Software",
    "ementa": "Processo de Software. Modelos de ciclo de vida de desenvolvimento de software. Homologação. Implantação de Software. Manutenção de Software. Gerência de requisitos. Garantia da Qualidade de Processos e Produtos. Métricas e Medições. Fábrica de Software. Modelos de qualidade de processos de software."
  },
  "TIN0123": {
    "nome": "Redes de Computadores-I",
    "ementa": "Redes de Computadores e Internet. Protocolos. Tecnologias de redes. Arquitetura TCP/IP. Camada de aplicação: serviços e protocolos. Camada de transporte: serviços e protocolos. Camada de rede: serviços e protocolos. Camada de enlace: serviços e protocolos."
  },
  "TIN0125": {
    "nome": "Projeto e Construção de Sistemas com SGBD",
    "ementa": "Modelos de dados e ferramentas de modelagem; técnicas de projeto estruturado e orientado a objetos; modelos para banco de dados: relacional, hierárquico, em redes, orientado a objetos; ferramentas CASE; dicionários de dados, repositórios, warehouses. Implementação: codificação Windows/GUI ou implementação, geração de código/aplicação, planejamento cliente-servidor, teste e instalação; conversão de sistema, treinamento e integração do usuário final e revisão pós-implementação."
  },
  "TIN0128": {
    "nome": "Informática na Educação",
    "ementa": "Histórico, evolução e tendências. Teorias de Aprendizagem e Métodos Educacionais. Sistemas computacionais voltados para a educação: tutorial (CAI), software educacional, jogo, simulador, editor, tecnologia de informação e comunicação (TIC). Educação a Distância (EAD)."
  },
  "TIN0130": {
    "nome": "Empreendedorismo",
    "ementa": "A Natureza de Pequena Empresa. Empreendedorismo. Estratégia. Marketing. Avaliação de Fatores Influenciadores na Escolha de um Negócio. Planejamento do Negócio. Viabilidade Financeira de um Negócio. Regularização do Negócio."
  },
  "TIN0131": {
    "nome": "Projeto de Graduação-I",
    "ementa": "Orientação para a escolha do tema para o desenvolvimento do Projeto de Graduação. Elaboração de uma proposta de trabalho de final de curso com a definição de um professor orientador."
  },
  "TIN0132": {
    "nome": "Gerência de Projetos em Informática",
    "ementa": "Conceitos de Projeto e Gerência de Projetos. Processos da Gerência de Projetos. Gerência de Recursos. Gerência de Riscos. Gerência da Qualidade. Gerência de Comunicação. Gerência de Mudanças. Gerência de Tempo. Gerência de Custos. Gerência de Escopo. Gerência de Aquisições. Planejamento de Projetos. Plano de Projeto. Acompanhamento de Projetos. Finalização de Projetos. PMBOK."
  },
  "TIN0133": {
    "nome": "Projeto de Graduação II",
    "ementa": "Implementação do projeto formulado em Projeto de Graduação I. Elaboração de uma monografia e apresentação oral do trabalho a uma banca examinadora."
  },
  "TIN0136": {
    "nome": "Gerência de Dados em Ambientes Distribuídos e Paralelos",
    "ementa": "Sistemas de Gerência de Bancos de Dados Distribuídos (SGBDD). Processamento paralelo em sistemas de banco de dados. Análise dos principais sistemas de banco de dados distribuídos e paralelos. Tendências atuais de gerência de dados em ambientes distribuídos e paralelos."
  },
  "TIN0141": {
    "nome": "Tópicos Avançados em Redes de Computadores-I",
    "ementa": "Tópicos selecionados sobre o estado da arte na área de Redes de Computadores."
  },
  "TIN0142": {
    "nome": "Programação Linear",
    "ementa": "Modelagem de problemas para a forma de programação linear. Método Simplex. Soluções iniciais e convergência. Dualidade e análise de sensibilidade. Princípio da Decomposição. Algoritmos de pontos interiores."
  },
  "TIN0143": {
    "nome": "Fluxos em Redes",
    "ementa": "O problema de fluxo em redes. Simplex para redes. Problemas de alocação e transporte. Algoritmo Out-of-Kilter. Fluxo maximal e problema do caminho mais curto."
  },
  "TIN0144": {
    "nome": "Algoritmos para Problemas Combinatórios",
    "ementa": "Problemas de otimização combinatória. Programação Dinâmica. Algoritmos Gulosos. Branch & Bound e A*. Heurísticas e metaheurísticas. Simulated annealing, busca tabu, algoritmos genéticos, GRASP e VNS."
  },
  "TIN0150": {
    "nome": "Ambiente Operacional UNIX",
    "ementa": "Interpretadores de comandos (Cshell, Bourne Shell), criação de scripts de comandos e programas. Principais utilitários do sistema. Processos e comunicação entre eles."
  },
  "TIN0162": {
    "nome": "Tópicos Avançados em Banco de Dados II",
    "ementa": "Tópicos selecionados sobre o estado da arte na área de Banco de Dados."
  },
  "TIN0163": {
    "nome": "Tópicos Avançados em Banco de Dados III",
    "ementa": "Tópicos selecionados sobre o estado da arte na área de Banco de Dados."
  },
  "TIN0164": {
    "nome": "Tópicos Avançados em Redes de Computadores II",
    "ementa": "Tópicos selecionados sobre o estado da arte na área de Redes de Computadores."
  },
  "TIN0165": {
    "nome": "Tópicos Avançados em Redes de Computadores III",
    "ementa": "Tópicos selecionados sobre o estado da arte na área de Redes de Computadores."
  },
  "TIN0166": {
    "nome": "Tópicos Avançados em Engenharia de Software II",
    "ementa": "Tópicos selecionados sobre o estado da arte na área de Engenharia de Software."
  },
  "TIN0169": {
    "nome": "Banco de Dados II",
    "ementa": "Revisão de SGBD relacional e SQL. Armazenamento de dados, Indexação e Processamento de Consultas. Projeto Físico de bancos de dados relacionais. Conceitos de Processamento de Transações. Segurança e Autorização em bancos de dados. Introdução à Orientação a Objetos em banco de dados. SGBD relacional-objeto."
  },
  "TIN0171": {
    "nome": "Projeto e Construção de Sistemas",
    "ementa": "Seleção de um ambiente com uma linguagem de programação que dê suporte ao modelo cliente-servidor; construção de programas: estruturado, orientado a eventos e a objetos; teste; asserção de qualidade de programas, implementação de sistema; treinamento de usuário; entrega de sistema; revisão pós-implementação; gerenciamento de configuração; manutenção; engenharia reversa e reengenharia."
  },
  "TIN1049": {
    "nome": "Computação Gráfica e Processamento de Imagens",
    "ementa": "Conceitos básicos. Teoria da cor. Imagem. Dispositivos e pacotes de software p/ computação gráfica. Programação usando bibliotecas gráficas, tecnologia de raster, algoritmos para traçado de retas, circunferências, letras e polígonos na tecnologia de raster; técnicas de armazenamento, compactação e recuperação de informações gráficas."
  },
  "TME0015": {
    "nome": "Álgebra Linear",
    "ementa": "Vetores. Matrizes. Espaços vetoriais. Transformações lineares. Resolução de sistemas de equações lineares por métodos diretos. Autovalores e auto-vetores. Diagonalização de operadores. Produto interno. Ortogonalização."
  },
  "TME0101": {
    "nome": "Matemática Básica",
    "ementa": "Teoria dos Conjuntos. Relações e Funções. Função do 1º grau, função do 2º grau, função modular. Composição de funções e função inversa. Função exponencial e função logarítmica. Funções trigonométricas. Números inteiros."
  },
  "TME0112": {
    "nome": "Cálculo Diferencial e Integral-I",
    "ementa": "Funções de uma Variável real. Números reais. Funções exponencial, logarítmica, trigonométricas diretas e inversas. Limites e continuidade. Funções contínuas em intervalos fechados. Derivadas. Regra da cadeia. O Teorema do Valor Médio. Fórmula de Taylor. Aplicações das derivadas. Máximos e mínimos. Gráficos. Integrais indefinidas. Equações diferenciais ordinárias de 1a e 2a ordem. Integral definida. O Teorema Fundamental do Cálculo e suas aplicações."
  },
  "TME0113": {
    "nome": "Cálculo Diferencial e Integral II",
    "ementa": "Técnicas de Integração. Aplicações da Integral Definida. Funções de Várias Variáveis: Limites, Continuidade e Diferenciabilidade. Gradiente, Regra da Cadeia, Teorema do Valor Médio. Derivadas Parciais de Ordem Superior e Teorema de Schwarz. Máximos e Mínimos de Funções de Várias Variáveis. Multiplicadores de Lagrange."
  },
  "TME0114": {
    "nome": "Probabilidade",
    "ementa": "Análise Combinatória. Noções de Probabilidade. Variáveis aleatórias. Modelos probabilísticos discretos e contínuos. Noções de linguagem S."
  },
  "TME0115": {
    "nome": "Estatística",
    "ementa": "Estatística descritiva. Principais características dos modelos probabilísticos discretos e contínuos. Noções de intervalo de confiança e testes de hipóteses. Noções de linguagem S."
  }
};
