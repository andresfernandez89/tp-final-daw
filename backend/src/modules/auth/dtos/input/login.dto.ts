import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** Credenciales enviadas a `POST /auth/login`. */
export class LoginDto {
  /** Número de documento del usuario (identificador de inicio de sesión). */
  @ApiProperty({
    description: 'Número de documento del usuario.',
    example: '30000001',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  documento: string;

  /** Contraseña en texto plano; se compara con el hash bcrypt almacenado. */
  @ApiProperty({
    format: 'password',
    description: 'Contraseña del usuario.',
    example: 'Clave123',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  clave: string;
}
