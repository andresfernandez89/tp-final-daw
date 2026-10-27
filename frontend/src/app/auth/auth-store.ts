import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import type { AuthUser } from './auth-user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly router = inject(Router);

  guardarToken(token: string): void {
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('El token no puede estar vacío.');
    }
    sessionStorage.setItem('accessToken', token);
  }

  guardarSesion(token: string, user: AuthUser): boolean {
    if (typeof token !== 'string' || !token.trim() || !this.esUsuarioValido(user)) {
      return false;
    }
    const usuario = { id: user.id, email: user.email, role: user.role };
    sessionStorage.setItem('user', JSON.stringify(usuario));
    this.guardarToken(token);
    return true;
  }

  obtenerToken(): string | null {
    const token = sessionStorage.getItem('accessToken');
    return token?.trim() ? token : null;
  }

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

  obtenerRol(): AuthUser['role'] | null {
    return this.obtenerUsuario()?.role ?? null;
  }

  cerrarSesion(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    this.router.navigateByUrl('/login');
  }

  private esUsuarioValido(value: unknown): value is AuthUser {
    if (typeof value !== 'object' || value === null) return false;
    const user = value as AuthUser;
    const idValido = Number.isInteger(user.id) && user.id > 0;
    const emailValido = typeof user.email === 'string' && user.email.trim().length > 0;
    const rolValido = ['MEDICO', 'PACIENTE', 'ADMINISTRADOR'].includes(user.role);

    return idValido && emailValido && rolValido;
  }
}
