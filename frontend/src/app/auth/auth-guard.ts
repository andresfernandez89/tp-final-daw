import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth-store';
import type { AuthUser } from './auth-user';

export const authGuard: CanActivateFn = () =>
  inject(AuthStore).obtenerToken() ? true : inject(Router).createUrlTree(['/login']);

export const roleGuard =
  (...roles: AuthUser['role'][]): CanActivateFn =>
  () => {
    const rol = inject(AuthStore).obtenerRol();
    return rol && roles.includes(rol) ? true : inject(Router).createUrlTree(['/turnos']);
  };
