import { UserRole } from '../enums/user-role.enum.js';

/**
 * Usuario autenticado que {@link AuthGuard} adjunta en `request.usuario`
 * a partir del payload del JWT.
 */
export interface AuthenticatedUser {
  /** Identificador del usuario (`usuarios.id`); es el claim `sub` del token. */
  sub: number;
  /** Rol del usuario; es el claim `role` del token. */
  role: UserRole;
}
