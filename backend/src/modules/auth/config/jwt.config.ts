import type { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';

/**
 * Construye la configuración del `JwtModule` a partir de las variables de
 * entorno.
 *
 * Requiere `JWT_SECRET` no vacío; de lo contrario la aplicación no arranca,
 * para evitar firmar tokens con un secreto indefinido. Los tokens expiran a
 * las 8 horas.
 *
 * @param configService Servicio de configuración de Nest con acceso al entorno.
 * @returns Opciones del módulo JWT (secreto y expiración).
 * @throws Error si `JWT_SECRET` no está definido o está vacío.
 */
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
