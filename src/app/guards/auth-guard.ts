import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';

/**
 * Guard function to protect routes that require authentication
 * @returns true if user is authenticated, false otherwise (redirects to login)
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedInSync) return true;

  // Return UrlTree to redirect without side effects
  return router.createUrlTree(['/login']);
};