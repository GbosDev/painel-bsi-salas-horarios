import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassSessionService } from '../../core/services/class-session.service';
import { CourseContextService } from '../../core/services/course-context.service';
import { NotificationService } from '../../core/services/notification.service';
import { RoomService } from '../../core/services/room.service';
import { ClassSession, WeeklySlot } from '../../core/models/class-session.model';
import { Room } from '../../core/models/room.model';

interface DraftSlot { dayNum: number; hour: number; }

@Component({
  selector: 'bs-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  private readonly classSessionService = inject(ClassSessionService);
  private readonly roomService = inject(RoomService);
  private readonly notifications = inject(NotificationService);
  readonly courseContext = inject(CourseContextService);

  readonly classSessions = signal<ClassSession[]>([]);
  readonly rooms = signal<Room[]>([]);
  readonly formOpen = signal(false);
  readonly deleteArmed = signal<number | null>(null);
  readonly editingId = signal<number | null>(null);
  query = '';
  newRoomName = '';

  // new/edit turma draft
  draft = { sigla: '', nome: '', codigo: '', periodo: '', professor: '', vagas: 0, sala: '' };
  draftSlots: DraftSlot[] = [{ dayNum: 1, hour: 8 }];
  readonly dayOptions = [1, 2, 3, 4, 5, 6];
  readonly hourOptions = [8, 10, 14, 16, 18, 20];

  readonly filtered = computed(() => {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.classSessions();
    return this.classSessions().filter((cs) => {
      const subject = cs.curr2023 ?? cs.curr2008;
      return `${subject?.sigla ?? ''} ${subject?.nome ?? ''} ${cs.professor ?? ''} ${cs.sala ?? ''}`.toLowerCase().includes(q);
    });
  });

  constructor() {
    effect(() => {
      const courseId = this.courseContext.selectedCourseId();
      this.reload(courseId);
    }, { allowSignalWrites: true });
  }

  private reload(courseId: string): void {
    this.classSessionService.list(courseId).subscribe((list) => this.classSessions.set(list));
    this.roomService.list(courseId).subscribe((rooms) => this.rooms.set(rooms));
  }

  roomInUse(nome: string): number {
    return this.classSessions().filter((cs) => cs.sala === nome).length;
  }

  openNewForm(): void {
    this.editingId.set(null);
    this.draft = { sigla: '', nome: '', codigo: '', periodo: '1', professor: '', vagas: 0, sala: '' };
    this.draftSlots = [{ dayNum: 1, hour: 8 }];
    this.formOpen.set(true);
  }

  openEditForm(cs: ClassSession): void {
    const subject = cs.curr2023 ?? cs.curr2008;
    this.editingId.set(cs.id);
    this.draft = {
      sigla: subject?.sigla ?? '', nome: subject?.nome ?? '', codigo: subject?.codigo ?? '',
      periodo: subject?.periodo ?? '', professor: cs.professor ?? '', vagas: cs.vagas, sala: cs.sala ?? '',
    };
    this.draftSlots = cs.sessions.map((s) => ({ dayNum: s.dayNum, hour: s.hour }));
    this.formOpen.set(true);
  }

  addSlotRow(): void { this.draftSlots.push({ dayNum: 1, hour: this.hourOptions[0] }); }
  removeSlotRow(index: number): void { this.draftSlots.splice(index, 1); }

  cancelForm(): void { this.formOpen.set(false); }

  submitForm(): void {
    if (!this.draft.sigla.trim() || !this.draft.nome.trim() || this.draftSlots.length === 0) {
      this.notifications.error('Informe sigla, disciplina e ao menos um horário.');
      return;
    }
    const courseId = this.courseContext.selectedCourseId();
    const sessions: WeeklySlot[] = this.draftSlots.map((s) => ({
      dayNum: s.dayNum,
      dayLabel: this.fullDay(s.dayNum),
      dayShort: this.shortDay(s.dayNum),
      hour: s.hour,
    }));

    if (this.editingId() !== null) {
      this.classSessionService.update(courseId, this.editingId()!, {
        professor: this.draft.professor || null,
        sala: this.draft.sala || null,
        sessions,
      }).subscribe({
        next: () => { this.notifications.success('Turma atualizada.'); this.formOpen.set(false); this.reload(courseId); },
      });
    } else {
      this.classSessionService.create(courseId, {
        curr2008: null,
        curr2023: {
          nome: this.draft.nome.trim(), sigla: this.draft.sigla.trim(),
          codigo: this.draft.codigo.trim() || null, periodo: this.draft.periodo.trim() || '1', ppgi: false,
        },
        professor: this.draft.professor || null,
        sessions,
        sala: this.draft.sala || null,
        vagas: this.draft.vagas || 0,
        section: 'regular',
        programa: null,
        ementaUrl: null,
      }).subscribe({
        next: () => { this.notifications.success('Turma criada.'); this.formOpen.set(false); this.reload(courseId); },
      });
    }
  }

  armDelete(id: number): void {
    if (this.deleteArmed() === id) {
      const courseId = this.courseContext.selectedCourseId();
      this.classSessionService.delete(courseId, id).subscribe({
        next: () => { this.notifications.success('Turma removida.'); this.deleteArmed.set(null); this.reload(courseId); },
      });
    } else {
      this.deleteArmed.set(id);
      setTimeout(() => { if (this.deleteArmed() === id) this.deleteArmed.set(null); }, 3000);
    }
  }

  addRoom(): void {
    const name = this.newRoomName.trim();
    if (!name) return;
    const courseId = this.courseContext.selectedCourseId();
    this.roomService.add(courseId, name).subscribe({
      next: () => { this.newRoomName = ''; this.reload(courseId); },
    });
  }

  removeRoom(room: Room): void {
    if (this.roomInUse(room.nome) > 0) {
      this.notifications.error(`Sala em uso por ${this.roomInUse(room.nome)} turma(s).`);
      return;
    }
    const courseId = this.courseContext.selectedCourseId();
    this.roomService.remove(courseId, room.nome).subscribe({
      next: () => this.reload(courseId),
    });
  }

  formatSessions(cs: ClassSession): string {
    return cs.sessions.map((s) => `${s.dayShort} ${s.hour}h`).join(' · ');
  }

  private fullDay(n: number): string {
    return ['', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][n] ?? '';
  }
  private shortDay(n: number): string {
    return ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][n] ?? '';
  }
}