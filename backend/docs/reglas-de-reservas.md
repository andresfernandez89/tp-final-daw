# Reglas de negocio de reservas

Todas las reglas de fecha y hora se evalúan en la zona horaria de la clínica, `America/Argentina/Buenos_Aires` (UTC-03:00). Las implementa `ReservationsService`.

## Turnos y disponibilidad

- Los turnos duran **una hora** y comienzan a las 08:00, 09:00, …, 15:00 (ocho turnos por día).
- `GET /reservations/availability?doctorId=&date=` devuelve los inicios libres de un médico activo para una fecha entre **hoy y 30 días** en adelante. Se excluyen los horarios con una reserva no cancelada y, si la fecha es hoy, los horarios cuya hora ya comenzó.
- Cada turno libre se devuelve como `dateTime` en formato `YYYY-MM-DDTHH:00:00-03:00`; ese mismo valor es el que debe enviarse al crear la reserva.

## Creación

`POST /reservations`:

- El `PACIENTE` reserva para sí mismo (puede omitir `patientId` o indicar su propio id; otro id produce `403`).
- El `ADMINISTRADOR` debe indicar `patientId` de un paciente activo (`400` si falta, `404` si no existe o está de baja).
- El médico debe estar activo (`404` si no).
- El horario debe ser futuro, dentro de los 30 días y comenzar entre las 08:00 y las 15:00 (`400` si no).
- Si el horario ya tiene una reserva no cancelada del mismo médico, `409`.
- La reserva nace en estado `ACTIVO` y **congela el valor de consulta** vigente del médico; cambios posteriores del arancel no la afectan.

La operación corre en una transacción con bloqueo pesimista sobre la fila del médico, de modo que dos solicitudes simultáneas para el mismo horario no puedan crear dos reservas.

## Estados y transiciones

```
ACTIVO ──► CANCELADO           (paciente o administrador, dentro del plazo)
ACTIVO ──► ATENDIDO | AUSENTE  (médico, desde el inicio del turno)
ATENDIDO ◄──► AUSENTE          (corrección del médico)
CANCELADO                      (final)
```

Cualquier otra transición responde `409`. Repetir una transición hacia el estado que la reserva ya tiene devuelve `200` sin escribir ni volver a evaluar plazos (idempotencia).

## Cancelación

`PATCH /reservations/:id/cancel`:

| Rol             | Sobre qué reservas | Plazo                                                               |
| --------------- | ------------------ | ------------------------------------------------------------------- |
| `PACIENTE`      | Sólo las propias   | Hasta el **día calendario anterior** al turno (hora de la clínica). |
| `ADMINISTRADOR` | Cualquiera         | Hasta el **instante de inicio** del turno.                          |

Fuera de plazo: `400`. Reserva de otro paciente: `403`. Reserva `ATENDIDO` o `AUSENTE`: `409`.

## Atención y ausencia

`PATCH /reservations/:id/attendance` con `{ "state": "ATENDIDO" | "AUSENTE" }`:

- Sólo el `MEDICO` asignado (`403` si la reserva es de otro médico).
- Disponible **desde el inicio del turno inclusive**, sin límite posterior (`400` si aún no comenzó).
- Permite corregir `ATENDIDO` ↔ `AUSENTE`. `CANCELADO` no se puede modificar (`409`).

## Listados

| Endpoint                   | Rol             | Contenido                                                           |
| -------------------------- | --------------- | ------------------------------------------------------------------- |
| `GET /reservations`        | `PACIENTE`      | Reservas propias.                                                   |
| `GET /reservations/admin`  | `ADMINISTRADOR` | Todas; filtros opcionales `state` (exacto) y `document` (exacto).   |
| `GET /reservations/agenda` | `MEDICO`        | Turnos propios del día `date` (obligatorio) con datos del paciente. |

Todos se ordenan por fecha y hora ascendente y por id como desempate, y devuelven un arreglo vacío si no hay coincidencias.

## Reloj y concurrencia

Los plazos de cancelación y atención se evalúan con `clock_timestamp()` de PostgreSQL, no con el reloj del proceso Node, y después de tomar el bloqueo de la fila. Así, dos solicitudes concurrentes sobre la misma reserva se serializan y la segunda revalida contra el estado ya persistido.
