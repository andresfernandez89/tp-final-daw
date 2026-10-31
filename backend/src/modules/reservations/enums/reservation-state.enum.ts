/**
 * Estados de una reserva. Coincide con el tipo `estados_reservas` de
 * PostgreSQL.
 *
 * Transiciones permitidas:
 * - `ACTIVO` → `CANCELADO` (paciente o administrador, dentro del plazo).
 * - `ACTIVO` → `ATENDIDO` | `AUSENTE` (médico, desde el inicio del turno).
 * - `ATENDIDO` ↔ `AUSENTE` (corrección del médico).
 * - `CANCELADO` es final.
 */
export enum ReservationState {
  /** Turno vigente; ocupa el horario del médico. */
  ACTIVO = 'ACTIVO',
  /** El paciente asistió y fue atendido. */
  ATENDIDO = 'ATENDIDO',
  /** El paciente no se presentó. */
  AUSENTE = 'AUSENTE',
  /** Turno cancelado; libera el horario. Estado final. */
  CANCELADO = 'CANCELADO',
}
