import { UserRole } from '../enums/user-role.enum.js';

export interface AuthenticatedUser {
  sub: number;
  role: UserRole;
}
