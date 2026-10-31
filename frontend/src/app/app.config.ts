import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth-interceptor';

/**
 * Configuración global de la aplicación standalone.
 *
 * Registra:
 * - los listeners globales de errores del navegador;
 * - el enrutador con las {@link routes} de la aplicación;
 * - `HttpClient` con el {@link authInterceptor}, que adjunta el JWT a las
 *   llamadas a la API;
 * - PrimeNG con el tema Aura, sin modo oscuro automático.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: 'none' } } }),
  ],
};
