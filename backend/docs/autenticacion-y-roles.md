# Autenticación y roles

## Inicio de sesión

La API autentica con **documento y clave** en `POST /api/v1/auth/login`. Sólo los usuarios con estado `ACTIVO` pueden iniciar sesión. La clave se compara contra un hash bcrypt; si el documento no existe, el usuario está dado de baja o la clave no coincide, la respuesta es siempre `401` con el mismo mensaje, para no revelar qué dato falló.

La respuesta incluye:

- `accessToken`: JWT firmado con `JWT_SECRET`, con los claims `sub` (id de usuario) y `role`. Expira a las **8 horas**.
- `user`: `id`, `email` y `role` del usuario.

## Uso del token

Todos los demás endpoints requieren la cabecera:

```
Authorization: Bearer <accessToken>
```

El guard `AuthGuard` verifica la firma y la expiración, valida que el payload tenga un `sub` entero positivo y un `role` conocido, y adjunta `{ sub, role }` en `request.usuario`. Si algo falla responde `401`.

La identidad del paciente o del médico **nunca se recibe por parámetro**: se toma siempre del token. Por eso `GET /reservations` devuelve sólo las reservas del paciente autenticado y `GET /reservations/agenda` sólo la agenda del médico autenticado.

## Roles

Cada usuario tiene exactamente un rol (`UserRole`):

| Rol             | Qué puede hacer                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `PACIENTE`      | Ver médicos, consultar disponibilidad, reservar para sí mismo, listar y cancelar sus reservas.                                  |
| `MEDICO`        | Consultar su agenda diaria y registrar atención o ausencia de sus turnos.                                                       |
| `ADMINISTRADOR` | Ver médicos y pacientes, reservar para cualquier paciente, listar y cancelar cualquier reserva, modificar el valor de consulta. |

El guard `RolesGuard` lee los roles declarados con el decorador `@Roles(...)` (en el handler o en la clase) y los compara con `request.usuario.role`. Un rol no autorizado recibe `403`. Siempre se aplica después de `AuthGuard`: `@UseGuards(AuthGuard, RolesGuard)`.

## Matriz de endpoints

| Método  | Ruta                           | PACIENTE | MEDICO  | ADMINISTRADOR |
| ------- | ------------------------------ | :------: | :-----: | :-----------: |
| `POST`  | `/auth/login`                  | público  | público |    público    |
| `GET`   | `/doctors`                     |    ✔     |         |       ✔       |
| `PATCH` | `/doctors/:id/valor-consulta`  |          |         |       ✔       |
| `GET`   | `/patients`                    |          |         |       ✔       |
| `GET`   | `/reservations/availability`   |    ✔     |         |       ✔       |
| `POST`  | `/reservations`                |    ✔     |         |       ✔       |
| `GET`   | `/reservations`                |    ✔     |         |               |
| `GET`   | `/reservations/admin`          |          |         |       ✔       |
| `GET`   | `/reservations/agenda`         |          |    ✔    |               |
| `PATCH` | `/reservations/:id/cancel`     |    ✔     |         |       ✔       |
| `PATCH` | `/reservations/:id/attendance` |          |    ✔    |               |

Todas las rutas llevan el prefijo `/api/v1`.

## Errores

Las respuestas de error usan el formato estándar de NestJS (`ErrorResponseDto`):

```json
{
  "statusCode": 403,
  "message": "No posee permisos suficientes para esta acción",
  "error": "Forbidden"
}
```

En los errores de validación del `ValidationPipe` (`400`), `message` es un arreglo con un mensaje por regla incumplida. El pipe está configurado con `whitelist` y `forbidNonWhitelisted`, por lo que cualquier propiedad desconocida en el cuerpo o en la consulta también produce `400`.
