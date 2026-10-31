/**
 * Roles de usuario del sistema. Coincide con el tipo `roles_usuarios` de
 * PostgreSQL. Cada usuario tiene exactamente un rol.
 */
export enum UserRole {
  /** Profesional que atiende turnos: consulta su agenda y registra atención/ausencia. */
  MEDICO = 'MEDICO',
  /** Reserva, consulta y cancela sus propios turnos. */
  PACIENTE = 'PACIENTE',
  /** Gestiona reservas de cualquier paciente, pacientes y valores de consulta. */
  ADMINISTRADOR = 'ADMINISTRADOR',
}
