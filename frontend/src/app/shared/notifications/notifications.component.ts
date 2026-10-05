import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'bs-notifications',
  standalone: true,
  template: `
    <div class="toast-stack">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="toast fade-in" [class]="toast.kind" (click)="notifications.dismiss(toast.id)">
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 340px;
    }
    .toast {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-soft);
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      color: var(--white);
    }
    .toast.error { background: var(--rose); }
    .toast.success { background: var(--teal); }
    .toast.info { background: var(--ink-soft); }
  `],
})
export class NotificationsComponent {
  readonly notifications = inject(NotificationService);
}
