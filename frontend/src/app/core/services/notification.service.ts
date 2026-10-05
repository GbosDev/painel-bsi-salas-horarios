import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  kind: 'error' | 'success' | 'info';
}

/** Minimal toast store backing the global error/success notifications in the shell. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  error(message: string): void { this.push(message, 'error'); }
  success(message: string): void { this.push(message, 'success'); }
  info(message: string): void { this.push(message, 'info'); }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(message: string, kind: Toast['kind']): void {
    const toast: Toast = { id: this.nextId++, message, kind };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), kind === 'error' ? 6000 : 3500);
  }
}
