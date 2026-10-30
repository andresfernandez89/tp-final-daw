import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth-store';
import type { AuthUser } from './auth-user';

/**
 * Guard de autenticación: permite la navegación si hay un token en
 * {@link AuthStore}; si no, redirige a `/login`.
 *
 * Se aplica al {@link Layout} en `canActivate` y `canActivateChild`, de modo
 * que protege todas las pantallas internas.
 */
export const authGuard: CanActivateFn = () =>
  inject(AuthStore).obtenerToken() ? true : inject(Router).createUrlTree(['/login']);

/**
 * Crea un guard de autorización por rol: permite la navegación si el rol del
 * usuario está entre los indicados; si no, redirige a `/turnos`.
 *
 * @example
 * ```ts
 * { path: 'medicos', canActivate: [roleGuard('ADMINISTRADOR')], ... }
 * ```
 *
 * @param roles Roles autorizados.
 * @returns Un `CanActivateFn` listo para usar en la definición de rutas.
 */
export const roleGuard =
  (...roles: AuthUser['role'][]): CanActivateFn =>
  () => {
    const rol = inject(AuthStore).obtenerRol();
    return rol && roles.includes(rol) ? true : inject(Router).createUrlTree(['/turnos']);
  };
