import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token =
    localStorage.getItem('jwt') ||   // we store JWT as 'jwt'
    localStorage.getItem('token');

  if (token && token.length > 0) return true;
  return router.parseUrl('/login');   // not logged in → go to login
};
