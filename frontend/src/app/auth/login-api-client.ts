import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../core/api.config';
import type { AuthUser } from './auth-user';

/** Respuesta de `POST /auth/login`. */
export interface LoginResponse {
  /** JWT que debe enviarse como `Authorization: Bearer <token>`. Expira a las 8 horas. */
  accessToken: string;
  /** Datos básicos del usuario autenticado. */
  user: AuthUser;
}

/** Cliente HTTP del endpoint de inicio de sesión. */
@Injectable({ providedIn: 'root' })
export class LoginApiClient {
  /** Cliente HTTP de Angular. */
  private readonly http = inject(HttpClient);

  /**
   * Inicia sesión con documento y clave.
   *
   * @param documento Número de documento del usuario.
   * @param clave Contraseña del usuario.
   * @returns Observable con el token y los datos del usuario. Responde `401` si las credenciales son inválidas.
   */
  login(documento: string, clave: string) {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, { documento, clave });
  }
}
