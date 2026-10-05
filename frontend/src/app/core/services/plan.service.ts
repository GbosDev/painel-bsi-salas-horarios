import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StudyPlanConflict { a: number; b: number; }
export interface StudyPlanResponse {
  chosenClassSessionIds: number[];
  conflicts: StudyPlanConflict[];
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  constructor(private readonly http: HttpClient) {}

  get(courseId: string): Observable<StudyPlanResponse> {
    return this.http.get<StudyPlanResponse>(`${environment.apiBaseUrl}/courses/${courseId}/plan`);
  }

  save(courseId: string, classSessionIds: number[]): Observable<StudyPlanResponse> {
    return this.http.put<StudyPlanResponse>(`${environment.apiBaseUrl}/courses/${courseId}/plan`, {
      classSessionIds,
    });
  }
}
