# Pantallas, rutas y roles

La aplicación es una SPA Angular **standalone** (sin NgModules) con carga diferida de cada pantalla. Las rutas están definidas en `app.routes.ts`.

## Rutas

| Ruta              | Componente       | Protección                                  |
| ----------------- | ---------------- | ------------------------------------------- |
| `/`               | —                | Redirige a `/login`.                        |
| `/login`          | `Login`          | Pública.                                    |
| `/turnos`         | `Reservations`   | `authGuard` (vía `Layout`).                 |
| `/reservar-turno` | `NewReservation` | `authGuard`; la pantalla valida el rol.     |
| `/medicos`        | `Doctors`        | `authGuard` + `roleGuard('ADMINISTRADOR')`. |
| `**`              | `NotFound`       | Pública.                                    |

Las tres pantallas internas son hijas del componente `Layout`, que aporta el encabezado (email y rol del usuario, botón de cerrar sesión) y la navegación, y aplica `authGuard` en `canActivate` y `canActivateChild`.

## Guards

- `authGuard`: deja pasar si hay un token en `AuthStore`; si no, redirige a `/login`.
- `roleGuard(...roles)`: fábrica de guards; deja pasar si el rol del usuario está entre los indicados; si no, redirige a `/turnos`.

## Qué ve cada rol

| Pantalla          | PACIENTE                                                        | MEDICO                                                                                 | ADMINISTRADOR                                                                    |
| ----------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/turnos`         | "Mis reservas": listado propio; cancelar hasta el día anterior. | "Mis turnos": agenda por fecha; marcar `ATENDIDO`/`AUSENTE` desde el inicio del turno. | "Reservas": todas, con filtros por documento y estado; cancelar hasta el inicio. |
| `/reservar-turno` | Elige médico, fecha y horario libre; reserva para sí mismo.     | No disponible (mensaje informativo).                                                   | Además elige el paciente.                                                        |
| `/medicos`        | Sin acceso (redirige a `/turnos`).                              | Sin acceso (redirige a `/turnos`).                                                     | Lista médicos y modifica el valor de consulta.                                   |

Los enlaces de la navegación del `Layout` se muestran según el rol: "Reservar turno" sólo para paciente y administrador, "Valores de consulta" sólo para administrador.

## Reglas replicadas en el cliente

Para habilitar o deshabilitar botones sin esperar al backend, las pantallas replican sus reglas de plazo (siempre en hora de Argentina):

- **Cancelar** (`Reservations.puedeCancelar`): sólo reservas `ACTIVO`; el administrador hasta el inicio del turno, el paciente hasta el día calendario anterior.
- **Marcar atención** (`Reservations.puedeMarcar`): sólo el médico, desde el inicio del turno, sobre turnos no cancelados y hacia un estado distinto del actual.
- **Reservar** (`NewReservation`): fecha entre hoy y 30 días; sólo horarios devueltos por la disponibilidad.

La decisión final siempre la toma el backend; si rechaza la operación, la pantalla muestra el error y recarga los datos.

## Interfaz

Los componentes de interfaz (tabla, diálogo, selector, botón, toast, popover, tooltip) provienen de **PrimeNG** con el tema Aura. Los formularios usan formularios reactivos (`Login`, `Doctors`) o `ngModel` (`Reservations`, `NewReservation`). El estado local se maneja con **signals**.
