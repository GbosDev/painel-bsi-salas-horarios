import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseCatalog } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  constructor(private readonly http: HttpClient) {}

  listCatalog(): Observable<CourseCatalog> {
    return this.http.get<CourseCatalog>(`${environment.apiBaseUrl}/courses`);
  }
}
