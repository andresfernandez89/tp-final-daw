/**
 * Estados de un usuario. Coincide con el tipo `estados_usuarios` de
 * PostgreSQL. Sólo los usuarios `ACTIVO` pueden iniciar sesión y participar
 * en reservas.
 */
export enum UserState {
  /** Usuario habilitado. */
  ACTIVO = 'ACTIVO',
  /** Usuario dado de baja: no puede iniciar sesión ni ser elegido en reservas. */
  BAJA = 'BAJA',
}
