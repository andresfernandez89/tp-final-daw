import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserRole } from '../enums/user-role.enum.js';

/**
 * Guard de autorización por rol.
 *
 * Lee los roles declarados con el decorador {@link Roles} (en el handler o, en
 * su defecto, en la clase) y los compara con `request.usuario.role`, que debe
 * haber adjuntado previamente {@link AuthGuard}. Por eso siempre se usa como
 * `@UseGuards(AuthGuard, RolesGuard)`, en ese orden.
 *
 * Si el handler no declara roles, permite el acceso. Si el rol no está
 * autorizado, responde `403 Forbidden`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Inyecta el lector de metadatos.
   *
   * @param reflector Lector de metadatos de Nest, para obtener los roles declarados.
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * Comprueba que el rol del usuario autenticado esté entre los permitidos.
   *
   * @param context Contexto de ejecución de Nest.
   * @returns `true` si no hay roles declarados o el rol está autorizado.
   * @throws ForbiddenException si el rol del usuario no está autorizado.
   */
  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const role = request.usuario?.role;

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    throw new ForbiddenException(
      'No posee permisos suficientes para esta acción',
    );
  }
}
