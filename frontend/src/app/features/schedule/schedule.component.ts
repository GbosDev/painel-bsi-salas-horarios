import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassSessionService } from '../../core/services/class-session.service';
import { CourseContextService } from '../../core/services/course-context.service';
import { ClassSession } from '../../core/models/class-session.model';

const DAY_SHORT: Record<number, string> = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' };

@Component({
  selector: 'bs-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css',
})
export class ScheduleComponent {
  private readonly classSessionService = inject(ClassSessionService);
  readonly courseContext = inject(CourseContextService);

  readonly dayShort = DAY_SHORT;
  readonly days = [1, 2, 3, 4, 5, 6];
  readonly classSessions = signal<ClassSession[]>([]);
  query = '';

  readonly filtered = computed(() => {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.classSessions();
    return this.classSessions().filter((cs) => {
      const subject = cs.curr2023 ?? cs.curr2008;
      const haystack = `${subject?.sigla ?? ''} ${subject?.nome ?? ''} ${cs.professor ?? ''} ${cs.sala ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  });

  readonly hours = computed(() => {
    const all = this.classSessions().flatMap((cs) => cs.sessions.map((s) => s.hour));
    if (all.length === 0) return [8, 10, 14, 16, 18, 20];
    const set = Array.from(new Set(all)).sort((a, b) => a - b);
    return set;
  });

  constructor() {
    effect(() => {
      const courseId = this.courseContext.selectedCourseId();
      this.classSessionService.list(courseId).subscribe((list) => this.classSessions.set(list));
    }, { allowSignalWrites: true });
  }

  sessionsAt(day: number, hour: number): ClassSession[] {
    return this.filtered().filter((cs) => cs.sessions.some((s) => s.dayNum === day && s.hour === hour));
  }

  subjectLabel(cs: ClassSession): string {
    const subject = cs.curr2023 ?? cs.curr2008;
    return subject ? `${subject.sigla} — ${subject.nome}` : '—';
  }
}