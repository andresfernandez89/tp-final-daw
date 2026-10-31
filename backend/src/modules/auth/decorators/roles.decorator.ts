import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum.js';

/** Clave de metadatos bajo la que {@link Roles} guarda los roles permitidos. */
export const ROLES_KEY = 'roles';

/**
 * Decorador que declara los roles autorizados para un controlador o handler.
 *
 * Debe usarse junto con {@link RolesGuard}, que lee estos metadatos y compara
 * con el rol del usuario autenticado. Si no se aplica, el guard permite el
 * acceso a cualquier rol.
 *
 * @example
 * ```ts
 * @Roles(UserRole.ADMINISTRADOR)
 * @UseGuards(AuthGuard, RolesGuard)
 * findAll() {}
 * ```
 *
 * @param roles Roles que pueden ejecutar la operación.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
