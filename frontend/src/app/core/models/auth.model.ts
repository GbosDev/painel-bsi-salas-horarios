export type Role = 'PROFESSOR' | 'ALUNO';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Session {
  token: string;
  expiresInSeconds: number;
  username: string;
  nome: string;
  role: Role;
  matricula: string | null;
  courseId: string | null;
  issuedAt: number;
}
