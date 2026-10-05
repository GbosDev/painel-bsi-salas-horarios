import { ClassSession } from './class-session.model';

export interface Room {
  id: string;
  nome: string;
}

export interface RoomOccupancy {
  sala: string;
  ocupada: boolean;
  ocupante: ClassSession | null;
}
