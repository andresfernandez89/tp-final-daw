import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../core/api.config';
import { AuthStore } from './auth-store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStore).obtenerToken();
  const path = request.url.split(/[?#]/)[0];
  const isApi = path === API_BASE_URL || path.startsWith(`${API_BASE_URL}/`);

  if (!token || !isApi) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
