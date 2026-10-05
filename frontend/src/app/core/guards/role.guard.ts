import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

/**
 * Real, route-level role gating — this is a UX convenience only: the
 * backend's @PreAuthorize checks are the actual authorization boundary
 * (replacing the legacy app's client-side-only IS_PROFESSOR flag, which
 * was trivially bypassable via localStorage.setItem in the browser console).
 */
export function roleGuard(allowed: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.session()?.role;

    if (role && allowed.includes(role)) return true;

    router.navigate(['/']);
    return false;
  };
}
