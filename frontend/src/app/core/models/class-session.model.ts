export interface Subject {
  nome: string;
  sigla: string;
  codigo: string | null;
  periodo: string | null;
  ppgi: boolean;
}

export interface WeeklySlot {
  dayNum: number;
  dayLabel: string;
  dayShort: string;
  hour: number;
}

export interface ClassSession {
  id: number;
  courseId: string;
  curr2008: Subject | null;
  curr2023: Subject | null;
  professor: string | null;
  sessions: WeeklySlot[];
  sala: string | null;
  vagas: number;
  section: 'regular' | 'pos';
  programa: string | null;
  ementaUrl: string | null;
}

export interface CreateClassSessionRequest {
  curr2008: Subject | null;
  curr2023: Subject | null;
  professor: string | null;
  sessions: WeeklySlot[];
  sala: string | null;
  vagas: number;
  section: 'regular' | 'pos';
  programa: string | null;
  ementaUrl: string | null;
}

export interface UpdateClassSessionRequest {
  professor: string | null;
  sala: string | null;
  sessions: WeeklySlot[] | null;
}
