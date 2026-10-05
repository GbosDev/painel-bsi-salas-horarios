import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SyllabusResponse { codigo: string; nome: string; ementa: string; }

@Injectable({ providedIn: 'root' })
export class SyllabusService {
  constructor(private readonly http: HttpClient) {}

  find(codigo: string): Observable<SyllabusResponse> {
    return this.http.get<SyllabusResponse>(`${environment.apiBaseUrl}/syllabus/${codigo}`);
  }
}
