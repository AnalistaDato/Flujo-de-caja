import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.navigate(['/login']).then(() => false);
  }

  const userRole = authService.getUserRole();
  const allowedRoles = route.data?.['rol'] as string[];

  if (!userRole || (allowedRoles && !allowedRoles.includes(userRole))) {
    return router.navigate(['/unauthorized']).then(() => false);
  }

  return true;
};
