import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api-error.model';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Centralized HTTP error handling, mirroring the backend's GlobalExceptionHandler:
 * every failed request surfaces a user-facing toast instead of a silent failure
 * or a raw browser alert() (the legacy app's only error-handling mechanism).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const apiError = err.error as ApiError | undefined;
      const message = apiError?.message ?? 'Não foi possível completar a operação. Tente novamente.';

      if (err.status === 401) {
        auth.logout();
        notifications.error('Sua sessão expirou. Faça login novamente.');
        router.navigate(['/login']);
      } else if (err.status === 403) {
        notifications.error('Você não tem permissão para executar esta ação.');
      } else if (err.status === 0) {
        notifications.error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      } else {
        notifications.error(message);
      }

      return throwError(() => err);
    })
  );
};
