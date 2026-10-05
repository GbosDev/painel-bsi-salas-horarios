import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./features/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'grade', pathMatch: 'full' },
      {
        path: 'salas',
        loadComponent: () => import('./features/rooms/rooms.component').then((m) => m.RoomsComponent),
      },
      {
        path: 'grade',
        loadComponent: () => import('./features/schedule/schedule.component').then((m) => m.ScheduleComponent),
      },
      {
        path: 'disciplinas',
        loadComponent: () => import('./features/subjects/subjects.component').then((m) => m.SubjectsComponent),
      },
      {
        path: 'plano',
        canActivate: [roleGuard(['ALUNO'])],
        loadComponent: () => import('./features/plan/plan.component').then((m) => m.PlanComponent),
      },
      {
        path: 'painel',
        canActivate: [roleGuard(['PROFESSOR'])],
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'admin',
        canActivate: [roleGuard(['PROFESSOR'])],
        loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
