import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UserRole } from '../enums/user-role.enum.js';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

/**
 * Guard de autenticación por JWT.
 *
 * Extrae el token de la cabecera `Authorization: Bearer <token>`, lo verifica
 * con `JwtService` y valida que el payload tenga un `sub` entero positivo y un
 * `role` conocido. Si todo es correcto, adjunta el usuario autenticado en
 * `request.usuario` para que lo usen {@link RolesGuard} y los controladores.
 *
 * Responde `401 Unauthorized` si falta el token, es inválido, expiró o su
 * payload no tiene la forma esperada.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Inyecta el servicio JWT.
   *
   * @param jwtService Servicio JWT configurado por {@link AuthModule}.
   */
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Verifica el token de la solicitud y adjunta el usuario autenticado.
   *
   * @param context Contexto de ejecución de Nest.
   * @returns `true` si el token es válido.
   * @throws UnauthorizedException si el token falta, es inválido o expiró.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token de acceso requerido.');
    }

    let payload: unknown;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token de acceso inválido.');
    }

    const usuario = this.parseAuthenticatedUser(payload);
    if (usuario === undefined) {
      throw new UnauthorizedException('Token de acceso inválido.');
    }

    request['usuario'] = usuario;

    return true;
  }

  /**
   * Convierte el payload del JWT en un {@link AuthenticatedUser}.
   *
   * @param payload Payload decodificado del token.
   * @returns El usuario autenticado, o `undefined` si el payload no es válido.
   */
  private parseAuthenticatedUser(
    payload: unknown,
  ): AuthenticatedUser | undefined {
    if (typeof payload !== 'object' || payload === null) {
      return undefined;
    }

    const { sub, role } = payload as { sub?: unknown; role?: unknown };

    if (
      typeof sub !== 'number' ||
      !Number.isInteger(sub) ||
      sub <= 0 ||
      typeof role !== 'string' ||
      !this.isUserRole(role)
    ) {
      return undefined;
    }

    return { sub, role };
  }

  /**
   * Indica si una cadena es uno de los valores de {@link UserRole}.
   *
   * @param value Valor a comprobar.
   */
  private isUserRole(value: string): value is UserRole {
    return (Object.values(UserRole) as string[]).includes(value);
  }

  /**
   * Obtiene el token de la cabecera `Authorization` con esquema `Bearer`.
   *
   * @param request Solicitud HTTP entrante.
   * @returns El token, o `undefined` si la cabecera falta o no usa `Bearer`.
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
