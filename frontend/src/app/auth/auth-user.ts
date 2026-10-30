/**
 * Usuario autenticado tal como lo devuelve `POST /auth/login` y como se
 * guarda en `sessionStorage`.
 */
export interface AuthUser {
  /** Identificador del usuario en el backend (`usuarios.id`). */
  id: number;
  /** Correo electrónico del usuario. */
  email: string;
  /** Rol del usuario; determina las pantallas y acciones disponibles. */
  role: 'MEDICO' | 'PACIENTE' | 'ADMINISTRADOR';
}

/** Etiquetas legibles de cada rol, usadas en el encabezado del {@link Layout}. */
export const ROLE_LABELS: Record<AuthUser['role'], string> = {
  MEDICO: 'Médico',
  PACIENTE: 'Paciente',
  ADMINISTRADOR: 'Administrador',
};
