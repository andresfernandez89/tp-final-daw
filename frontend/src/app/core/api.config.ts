/**
 * URL base de la API, relativa al origen del frontend.
 *
 * En desarrollo, `ng serve` redirige `/api/**` al backend mediante
 * `src/proxy.conf.mjs`; en producción debe servirse el frontend detrás del
 * mismo origen que la API o configurarse un proxy equivalente. El
 * {@link authInterceptor} sólo adjunta el token a las solicitudes cuya URL
 * comienza con este prefijo.
 */
export const API_BASE_URL = '/api/v1';
