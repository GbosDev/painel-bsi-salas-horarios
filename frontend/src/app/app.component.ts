import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationsComponent } from './shared/notifications/notifications.component';

@Component({
  selector: 'bs-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent],
  template: `
    <router-outlet />
    <bs-notifications />
  `,
})
export class AppComponent {}
