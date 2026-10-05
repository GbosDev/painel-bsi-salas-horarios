import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Room, RoomOccupancy } from '../models/room.model';

@Injectable({ providedIn: 'root' })
export class RoomService {
  constructor(private readonly http: HttpClient) {}

  private base(courseId: string): string {
    return `${environment.apiBaseUrl}/courses/${courseId}/rooms`;
  }

  list(courseId: string): Observable<Room[]> {
    return this.http.get<Room[]>(this.base(courseId));
  }

  occupancy(courseId: string, day: number, hour: number): Observable<RoomOccupancy[]> {
    return this.http.get<RoomOccupancy[]>(`${this.base(courseId)}/occupancy`, {
      params: { day, hour },
    });
  }

  add(courseId: string, nome: string): Observable<Room> {
    return this.http.post<Room>(this.base(courseId), { nome });
  }

  remove(courseId: string, nome: string): Observable<void> {
    return this.http.delete<void>(`${this.base(courseId)}/${encodeURIComponent(nome)}`);
  }
}
