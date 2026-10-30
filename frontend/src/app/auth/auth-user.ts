export interface AuthUser {
  id: number;
  email: string;
  role: 'MEDICO' | 'PACIENTE' | 'ADMINISTRADOR';
}

export const ROLE_LABELS: Record<AuthUser['role'], string> = {
  MEDICO: 'Médico',
  PACIENTE: 'Paciente',
  ADMINISTRADOR: 'Administrador',
};
