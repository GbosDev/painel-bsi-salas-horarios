import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface DemoAccount {
  user: string;
  pass: string;
  label: string;
  role: 'aluno' | 'professor';
}

@Component({
  selector: 'bs-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly demoAccounts: DemoAccount[] = [
    { user: 'ana', pass: 'aluno1', label: 'Ana', role: 'aluno' },
    { user: 'pedro', pass: 'aluno2', label: 'Pedro', role: 'aluno' },
    { user: 'jefferson', pass: 'jef2026', label: 'Prof. Jefferson', role: 'professor' },
    { user: 'jobson', pass: 'job2026', label: 'Prof. Jobson', role: 'professor' },
    { user: 'geiza', pass: 'gei2026', label: 'Profa. Geiza', role: 'professor' },
  ];

  fillDemo(account: DemoAccount): void {
    this.username = account.user;
    this.password = account.pass;
    this.errorMessage.set(null);
  }

  submit(): void {
    if (!this.username.trim() || !this.password.trim()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Usuário ou senha incorretos. Confira as credenciais de teste abaixo.');
        this.password = '';
      },
    });
  }
}
