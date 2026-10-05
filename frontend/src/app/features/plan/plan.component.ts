import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassSessionService } from '../../core/services/class-session.service';
import { CourseContextService } from '../../core/services/course-context.service';
import { NotificationService } from '../../core/services/notification.service';
import { PlanService, StudyPlanConflict } from '../../core/services/plan.service';
import { ClassSession } from '../../core/models/class-session.model';

@Component({
  selector: 'bs-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan.component.html',
  styleUrl: './plan.component.css',
})
export class PlanComponent {
  private readonly classSessionService = inject(ClassSessionService);
  private readonly planService = inject(PlanService);
  private readonly notifications = inject(NotificationService);
  readonly courseContext = inject(CourseContextService);

  readonly classSessions = signal<ClassSession[]>([]);
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly conflicts = signal<StudyPlanConflict[]>([]);
  readonly saving = signal(false);
  query = '';

  readonly filtered = computed(() => {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.classSessions();
    return this.classSessions().filter((cs) => {
      const subject = cs.curr2023 ?? cs.curr2008;
      return `${subject?.sigla ?? ''} ${subject?.nome ?? ''} ${cs.professor ?? ''}`.toLowerCase().includes(q);
    });
  });

  readonly chosen = computed(() =>
      this.classSessions().filter((cs) => this.selectedIds().has(cs.id))
  );

  readonly conflictKeys = computed(() => {
    const keys = new Set<string>();
    for (const c of this.conflicts()) { keys.add(`${c.a}`); keys.add(`${c.b}`); }
    return keys;
  });

  constructor() {
    effect(() => {
      const courseId = this.courseContext.selectedCourseId();
      this.classSessionService.list(courseId).subscribe((list) => this.classSessions.set(list));
      this.planService.get(courseId).subscribe((plan) => {
        this.selectedIds.set(new Set(plan.chosenClassSessionIds));
        this.conflicts.set(plan.conflicts);
      });
    }, { allowSignalWrites: true });
  }

  toggle(cs: ClassSession): void {
    const set = new Set(this.selectedIds());
    if (set.has(cs.id)) set.delete(cs.id); else set.add(cs.id);
    this.selectedIds.set(set);
  }

  isSelected(cs: ClassSession): boolean {
    return this.selectedIds().has(cs.id);
  }

  save(): void {
    this.saving.set(true);
    const courseId = this.courseContext.selectedCourseId();
    this.planService.save(courseId, [...this.selectedIds()]).subscribe({
      next: (result) => {
        this.conflicts.set(result.conflicts);
        this.saving.set(false);
        this.notifications.success('Plano salvo com sucesso.');
      },
      error: () => this.saving.set(false),
    });
  }

  subjectLabel(cs: ClassSession): string {
    const subject = cs.curr2023 ?? cs.curr2008;
    return subject ? `${subject.sigla} — ${subject.nome}` : '—';
  }
}