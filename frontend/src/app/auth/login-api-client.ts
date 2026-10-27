import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../core/api.config';
import type { AuthUser } from './auth-user';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class LoginApiClient {
  private readonly http = inject(HttpClient);

  login(documento: string, clave: string) {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, { documento, clave });
  }
}
