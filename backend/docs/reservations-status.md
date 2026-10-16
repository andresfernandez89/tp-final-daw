# Reservas: cancelación (2.5)

## API implementada

Todas las rutas requieren JWT Bearer y devuelven `OutputReservationDto` validado:
`id`, `doctorId`, `patientId`, `dateTime` (ISO 8601 con zona), `state`, `consultationFee`.
No se cambian médico, paciente, horario ni arancel congelado.

| Ruta                                        | Roles                   | Entrada                                        |
| ------------------------------------------- | ----------------------- | ---------------------------------------------- |
| `PATCH /api/v1/reservations/:id/cancel`     | PACIENTE, ADMINISTRADOR | Sin cuerpo requerido                           |

El paciente sólo cancela sus reservas (`JWT.sub = reservas.id_paciente`).
La identidad nunca se toma del cuerpo.

### Matriz acordada

| Estado actual | CANCELADO           |
| ------------- | ------------------- |
| ACTIVO        | Cancelación         |
| CANCELADO     | Éxito sin escritura |
| ATENDIDO      | Conflicto           |
| AUSENTE       | Conflicto           |

Siempre se aplican autenticación, rol, existencia y pertenencia, incluso en un
reintento. Repetir una cancelación autorizada responde `200` sin `UPDATE`, aunque
el plazo temporal ya no habilite una nueva modificación. No existe restauración
a ACTIVO ni reversión de CANCELADO.

### Tiempo

- Zona de clínica: **America/Argentina/Buenos_Aires**, explícita e independiente
  de la zona del proceso Node o de la sesión PostgreSQL.
- `fecha_hora` existente es `timestamp without time zone`: se interpreta como
  hora de pared de la clínica, y se convierte a instante al leer la operación.
- Paciente: puede cancelar hasta las 23:59:59.999 del día calendario anterior.
  No se exige una diferencia de 24 horas; desde medianoche del día de consulta falla.
- Administrador: puede cancelar estrictamente antes del inicio; igualdad falla.
- El reloj de autoridad es `clock_timestamp()` de PostgreSQL, leído **después** de
  adquirir el bloqueo, no la hora de llegada HTTP ni el inicio de la transacción.

### Errores y Swagger

`400`: ID inválido (entero positivo de PostgreSQL), plazo temporal;
`401`: JWT ausente/inválido; `403`: rol/pertenencia; `404`: reserva inexistente;
`409`: transición incompatible; `500`: persistencia o salida inválida. Swagger
documenta la cancelación, el DTO de salida, los límites y las respuestas.

## Atomicidad sobre reservas existentes

Cada operación usa una transacción TypeORM y `SELECT ... FOR UPDATE OF r` sobre
la reserva. Estado y pertenencia se leen bajo bloqueo; la transición y el reloj
se revalidan allí. Se actualiza exclusivamente `estado`; el DTO se mapea y valida
antes del commit. Las excepciones revierten la transacción y liberan el bloqueo.

Esto serializa cancelaciones concurrentes. Dos cancelaciones propias son
idempotentes. Cada operación revalida el estado bajo lock; ATENDIDO y AUSENTE
no se pueden cancelar. No se usa un `save` de entidad leída fuera del lock.

## Contrato de integración pendiente: disponibilidad y creación

**No implementadas en esta entrega:** la disponibilidad sigue siendo el stub
preexistente y no existe creación de reservas. No se añadieron migraciones.
Los cambios de estado no garantizan ausencia de duplicados en una
creación inexistente ni que el endpoint de disponibilidad liste el slot liberado.

Para la integración futura:

1. Sólo CANCELADO libera un horario. ACTIVO, ATENDIDO y AUSENTE lo ocupan.
   Consultar disponibilidad con `estado <> 'CANCELADO'` y la misma interpretación
   horaria; una cancelación sólo resulta visible después del commit.
2. La creación no debe confiar en `SELECT` previo sin protección. Debe existir
   exclusión atómica del slot médico/fecha-hora, por ejemplo un índice único
   parcial `(id_medico, fecha_hora) WHERE estado <> 'CANCELADO'`, previa auditoría
   de duplicados y migración coordinada. Esta restricción **no está instalada**.
3. Ese índice coordinaría creación con cancelación: PostgreSQL esperaría la
   transacción que cambia el predicado; sólo después de su commit podría reutilizar
   el slot. El creador debe manejar conflicto único y, si corresponde, reintentar.
4. Los componentes futuros mantienen horarios 08–16 (último inicio 15), duración
   de una hora, máximo 30 días, identidades activas y precio congelado. Esas reglas
   de creación no se agregan ni se vuelven a aplicar retroactivamente aquí.

**Advertencia de setup:** `npm run db:seed --prefix backend` es destructivo:
trunca usuarios, médicos y reservas, reinicia identidades y refresca fechas.
Requiere autorización explícita sobre la base destino.
