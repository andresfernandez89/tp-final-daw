# Sesión y comunicación con la API

## Inicio de sesión

`Login` envía documento y clave a `POST /api/v1/auth/login` mediante `LoginApiClient`. La respuesta trae `accessToken` (JWT, 8 horas) y `user` (`id`, `email`, `role`).

## Almacenamiento de la sesión

`AuthStore` guarda el token y el usuario en **`sessionStorage`** (claves `accessToken` y `user`). La sesión vive mientras la pestaña esté abierta y no se comparte entre pestañas. Al leer, valida la forma de los datos: si el token falta o el usuario guardado es inválido, se comporta como si no hubiera sesión.

`cerrarSesion()` borra ambas claves y navega a `/login`.

## Token en cada solicitud

`authInterceptor`, registrado en `app.config.ts` con `provideHttpClient(withInterceptors([...]))`, agrega la cabecera `Authorization: Bearer <token>` a toda solicitud cuya URL comience con `API_BASE_URL` (`/api/v1`). Las demás solicitudes pasan sin cambios.

## URL de la API y proxy de desarrollo

`API_BASE_URL` es relativa (`/api/v1`). En desarrollo, `ng serve` usa `src/proxy.conf.mjs` para redirigir `/api/**` al backend:

- Si está definida la variable de entorno `BACKEND_URL`, se usa como destino.
- Si no, se lee `PORT` de `../backend/.env` y se apunta a `http://localhost:{PORT}`; sin `PORT`, a `http://localhost:3000`.

Al arrancar, el proxy imprime el destino elegido: `[proxy] /api -> http://localhost:9091`.

## Clientes HTTP

Cada pantalla tiene un cliente `@Injectable({ providedIn: 'root' })` con un método por endpoint, tipado con interfaces que reflejan los DTOs del backend:

| Cliente                | Endpoints                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LoginApiClient`       | `POST /auth/login`                                                                                                                                                                  |
| `ReservationsClient`   | `GET /reservations`, `GET /reservations/admin`, `GET /reservations/agenda`, `PATCH /reservations/:id/cancel`, `PATCH /reservations/:id/attendance`, `GET /patients`, `GET /doctors` |
| `NewReservationClient` | `GET /doctors`, `GET /patients`, `GET /reservations/availability`, `POST /reservations`                                                                                             |
| `DoctorsClient`        | `PATCH /doctors/:id/valor-consulta`                                                                                                                                                 |

## Manejo de errores

- `401` en el login: "Documento o clave inválidos.".
- `409` al reservar: el horario se ocupó; se recargan los horarios libres.
- En el resto de los casos se muestra un mensaje genérico (en línea o como toast) y, cuando corresponde, se recargan los datos. Al marcar atención se muestra el `message` devuelto por el backend si es una cadena.

## Fechas y horas

El backend trabaja en la zona horaria de la clínica (`America/Argentina/Buenos_Aires`). El frontend formatea todas las fechas y horas con `Intl.DateTimeFormat` fijando esa zona, de modo que la pantalla muestre lo mismo sin importar la zona del navegador. Los importes se formatean con `formatearValor` (pesos argentinos sin decimales).
