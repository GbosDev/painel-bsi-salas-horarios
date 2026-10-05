import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ClassSessionService } from '../../core/services/class-session.service';
import { CourseContextService } from '../../core/services/course-context.service';
import { ClassSession } from '../../core/models/class-session.model';

const DAY_SHORT: Record<number, string> = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' };

@Component({
  selector: 'bs-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly classSessionService = inject(ClassSessionService);
  readonly courseContext = inject(CourseContextService);

  readonly classSessions = signal<ClassSession[]>([]);

  readonly totalTurmas = computed(() => this.classSessions().length);
  readonly totalVagas = computed(() => this.classSessions().reduce((sum, cs) => sum + cs.vagas, 0));
  readonly totalProfessores = computed(() =>
      new Set(this.classSessions().map((cs) => cs.professor).filter(Boolean)).size
  );
  readonly totalSalas = computed(() =>
      new Set(this.classSessions().map((cs) => cs.sala).filter(Boolean)).size
  );

  readonly aulasPorDia = computed(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const cs of this.classSessions()) {
      for (const s of cs.sessions) counts[s.dayNum] = (counts[s.dayNum] ?? 0) + 1;
    }
    return Object.entries(counts).map(([day, count]) => ({
      day: DAY_SHORT[+day] ?? day,
      count,
    }));
  });

  readonly maxAulas = computed(() => Math.max(1, ...this.aulasPorDia().map((d) => d.count)));

  constructor() {
    effect(() => {
      const courseId = this.courseContext.selectedCourseId();
      this.classSessionService.list(courseId).subscribe((list) => this.classSessions.set(list));
    }, { allowSignalWrites: true });
  }
}