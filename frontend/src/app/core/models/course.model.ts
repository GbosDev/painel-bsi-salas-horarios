export interface Course {
  id: string;
  grupo: string | null;
  sigla: string;
  painel: string | null;
  nome: string;
  unidade: string | null;
  status: 'completo' | 'escopo';
  descricao: string | null;
}

export interface CourseGroup {
  id: string;
  sigla: string;
  nome: string;
  descricao: string | null;
}

export interface CourseCatalog {
  courses: Course[];
  groups: CourseGroup[];
}
