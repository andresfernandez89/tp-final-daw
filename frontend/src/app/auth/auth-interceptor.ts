import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../core/api.config';
import { AuthStore } from './auth-store';

/**
 * Interceptor HTTP que adjunta el JWT a las llamadas a la API.
 *
 * Si hay un token en {@link AuthStore} y la URL de la solicitud comienza con
 * {@link API_BASE_URL}, agrega la cabecera `Authorization: Bearer <token>`.
 * Las demás solicitudes (por ejemplo, recursos estáticos) pasan sin cambios.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStore).obtenerToken();
  const path = request.url.split(/[?#]/)[0];
  const isApi = path === API_BASE_URL || path.startsWith(`${API_BASE_URL}/`);

  if (!token || !isApi) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
