export interface AuthUser {
  id: number;
  email: string;
  role: 'MEDICO' | 'PACIENTE' | 'ADMINISTRADOR';
}
