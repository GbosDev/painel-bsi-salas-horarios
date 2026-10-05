import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CourseContextService } from '../../core/services/course-context.service';

@Component({
  selector: 'bs-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly courseContext = inject(CourseContextService);
  private readonly router = inject(Router);

  onCourseChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.courseContext.select(value);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
