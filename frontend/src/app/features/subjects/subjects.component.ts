import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassSessionService } from '../../core/services/class-session.service';
import { CourseContextService } from '../../core/services/course-context.service';
import { SyllabusService } from '../../core/services/syllabus.service';
import { ClassSession, Subject } from '../../core/models/class-session.model';

interface SubjectRow {
  classSessionId: number;
  curriculum: '2008' | '2023';
  subject: Subject;
  professor: string | null;
  sala: string | null;
}

@Component({
  selector: 'bs-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.css',
})
export class SubjectsComponent {
  private readonly classSessionService = inject(ClassSessionService);
  private readonly syllabusService = inject(SyllabusService);
  readonly courseContext = inject(CourseContextService);

  readonly classSessions = signal<ClassSession[]>([]);
  readonly selectedEmenta = signal<string | null>(null);
  readonly selectedNome = signal<string | null>(null);
  query = '';

  readonly rows = computed<SubjectRow[]>(() => {
    const rows: SubjectRow[] = [];
    for (const cs of this.classSessions()) {
      if (cs.curr2008) rows.push({ classSessionId: cs.id, curriculum: '2008', subject: cs.curr2008, professor: cs.professor, sala: cs.sala });
      if (cs.curr2023) rows.push({ classSessionId: cs.id, curriculum: '2023', subject: cs.curr2023, professor: cs.professor, sala: cs.sala });
    }
    const q = this.query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.subject.sigla} ${r.subject.nome}`.toLowerCase().includes(q));
  });

  constructor() {
    effect(() => {
      const courseId = this.courseContext.selectedCourseId();
      this.classSessionService.list(courseId).subscribe((list) => this.classSessions.set(list));
    }, { allowSignalWrites: true });
  }

  openEmenta(row: SubjectRow): void {
    if (!row.subject.codigo) {
      this.selectedNome.set(row.subject.nome);
      this.selectedEmenta.set('Ementa não disponível para esta disciplina.');
      return;
    }
    this.syllabusService.find(row.subject.codigo).subscribe({
      next: (res) => { this.selectedNome.set(res.nome); this.selectedEmenta.set(res.ementa); },
      error: () => { this.selectedNome.set(row.subject.nome); this.selectedEmenta.set('Ementa não cadastrada.'); },
    });
  }

  closeEmenta(): void {
    this.selectedEmenta.set(null);
    this.selectedNome.set(null);
  }
}