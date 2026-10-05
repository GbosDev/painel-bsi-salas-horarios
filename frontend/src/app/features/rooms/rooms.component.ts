import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseContextService } from '../../core/services/course-context.service';
import { RoomService } from '../../core/services/room.service';
import { Room, RoomOccupancy } from '../../core/models/room.model';

const DAYS = [
  { num: 1, short: 'Seg' }, { num: 2, short: 'Ter' }, { num: 3, short: 'Qua' },
  { num: 4, short: 'Qui' }, { num: 5, short: 'Sex' }, { num: 6, short: 'Sáb' },
];
const HOURS = [8, 10, 14, 16, 18, 20];

@Component({
  selector: 'bs-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css',
})
export class RoomsComponent {
  private readonly roomService = inject(RoomService);
  readonly courseContext = inject(CourseContextService);

  readonly days = DAYS;
  readonly hours = HOURS;
  readonly rooms = signal<Room[]>([]);
  readonly occupancy = signal<RoomOccupancy[]>([]);
  readonly loading = signal(false);

  day = DAYS[0].num;
  hour = HOURS[0];

  constructor() {
    effect(() => {
      const courseId = this.courseContext.selectedCourseId();
      this.roomService.list(courseId).subscribe((rooms) => this.rooms.set(rooms));
      this.refreshOccupancy(courseId);
    }, { allowSignalWrites: true });
  }

  onSlotChange(): void {
    this.refreshOccupancy(this.courseContext.selectedCourseId());
  }

  private refreshOccupancy(courseId: string): void {
    this.loading.set(true);
    this.roomService.occupancy(courseId, this.day, this.hour).subscribe({
      next: (occ) => { this.occupancy.set(occ); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}