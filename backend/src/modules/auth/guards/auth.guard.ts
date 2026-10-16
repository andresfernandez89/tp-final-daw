import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UserRole } from '../enums/user-role.enum.js';

interface AuthenticatedUser {
  sub: number;
  role: UserRole;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

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

  private isUserRole(value: string): value is UserRole {
    return (Object.values(UserRole) as string[]).includes(value);
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
