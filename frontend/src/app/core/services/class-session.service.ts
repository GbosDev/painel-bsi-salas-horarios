import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ClassSession,
  CreateClassSessionRequest,
  UpdateClassSessionRequest,
} from '../models/class-session.model';

@Injectable({ providedIn: 'root' })
export class ClassSessionService {
  constructor(private readonly http: HttpClient) {}

  private base(courseId: string): string {
    return `${environment.apiBaseUrl}/courses/${courseId}/class-sessions`;
  }

  list(courseId: string): Observable<ClassSession[]> {
    return this.http.get<ClassSession[]>(this.base(courseId));
  }

  create(courseId: string, request: CreateClassSessionRequest): Observable<ClassSession> {
    return this.http.post<ClassSession>(this.base(courseId), request);
  }

  update(courseId: string, id: number, request: UpdateClassSessionRequest): Observable<ClassSession> {
    return this.http.put<ClassSession>(`${this.base(courseId)}/${id}`, request);
  }

  delete(courseId: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base(courseId)}/${id}`);
  }
}
