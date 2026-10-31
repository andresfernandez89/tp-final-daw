import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import type { AuthUser } from './auth-user';

/**
 * Almacén de la sesión del usuario.
 *
 * Guarda el token de acceso y los datos del usuario en `sessionStorage`
 * (claves `accessToken` y `user`), por lo que la sesión dura mientras la
 * pestaña esté abierta. Valida los datos al leerlos: si están corruptos o
 * falta el token, se comporta como si no hubiera sesión.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  /** Enrutador, usado para volver al login al cerrar sesión. */
  private readonly router = inject(Router);

  /**
   * Guarda el token de acceso.
   *
   * @param token JWT devuelto por el backend.
   * @throws Error si el token está vacío.
   */
  guardarToken(token: string): void {
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('El token no puede estar vacío.');
    }
    sessionStorage.setItem('accessToken', token);
  }

  /**
   * Guarda la sesión completa (usuario y token) si ambos son válidos.
   *
   * @param token JWT devuelto por el backend.
   * @param user Datos del usuario devueltos por el backend.
   * @returns `true` si la sesión se guardó; `false` si el token o el usuario no son válidos.
   */
  guardarSesion(token: string, user: AuthUser): boolean {
    if (typeof token !== 'string' || !token.trim() || !this.esUsuarioValido(user)) {
      return false;
    }
    const usuario = { id: user.id, email: user.email, role: user.role };
    sessionStorage.setItem('user', JSON.stringify(usuario));
    this.guardarToken(token);
    return true;
  }

  /**
   * Devuelve el token de acceso guardado.
   *
   * @returns El token, o `null` si no hay sesión.
   */
  obtenerToken(): string | null {
    const token = sessionStorage.getItem('accessToken');
    return token?.trim() ? token : null;
  }

  /**
   * Devuelve el usuario de la sesión actual.
   *
   * @returns El usuario, o `null` si no hay token o los datos guardados no son válidos.
   */
  obtenerUsuario(): AuthUser | null {
    if (!this.obtenerToken()) return null;
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) return null;
    try {
      const user: unknown = JSON.parse(storedUser);
      return this.esUsuarioValido(user) ? user : null;
    } catch {
      return null;
    }
  }

  /**
   * Devuelve el rol del usuario de la sesión actual.
   *
   * @returns El rol, o `null` si no hay sesión.
   */
  obtenerRol(): AuthUser['role'] | null {
    return this.obtenerUsuario()?.role ?? null;
  }

  /** Elimina la sesión de `sessionStorage` y navega a `/login`. */
  cerrarSesion(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    this.router.navigateByUrl('/login');
  }

  /**
   * Comprueba que un valor tenga la forma de {@link AuthUser}: id entero
   * positivo, email no vacío y rol conocido.
   *
   * @param value Valor a comprobar.
   */
  private esUsuarioValido(value: unknown): value is AuthUser {
    if (typeof value !== 'object' || value === null) return false;
    const user = value as AuthUser;
    const idValido = Number.isInteger(user.id) && user.id > 0;
    const emailValido = typeof user.email === 'string' && user.email.trim().length > 0;
    const rolValido = ['MEDICO', 'PACIENTE', 'ADMINISTRADOR'].includes(user.role);

    return idValido && emailValido && rolValido;
  }
}
