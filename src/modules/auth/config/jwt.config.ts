import type { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';

export function getJwtConfig(configService: ConfigService): JwtModuleOptions {
  const secret = configService.get<string>('JWT_SECRET');
  if (typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error('Error de configuración de la aplicación.');
  }

  return {
    secret,
    signOptions: { expiresIn: '8h' },
  };
}
