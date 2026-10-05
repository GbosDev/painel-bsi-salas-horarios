import { Injectable, computed, inject, signal } from '@angular/core';
import { CourseService } from './course.service';
import { AuthService } from './auth.service';
import { Course, CourseGroup } from '../models/course.model';

/** Holds which course is currently selected in the course switcher, shared across every feature view. */
@Injectable({ providedIn: 'root' })
export class CourseContextService {
  private readonly courseService = inject(CourseService);
  private readonly auth = inject(AuthService);

  readonly courses = signal<Course[]>([]);
  readonly groups = signal<CourseGroup[]>([]);
  readonly selectedCourseId = signal<string>(this.auth.session()?.courseId ?? 'bsi');

  readonly selectedCourse = computed(() =>
    this.courses().find((c) => c.id === this.selectedCourseId()) ?? null
  );

  constructor() {
    this.courseService.listCatalog().subscribe((catalog) => {
      this.courses.set(catalog.courses);
      this.groups.set(catalog.groups);
    });
  }

  select(courseId: string): void {
    this.selectedCourseId.set(courseId);
  }
}
