import { ApiProperty } from '@nestjs/swagger';
import { LoginUserDto } from './login-user.dto.js';

/** Respuesta de `POST /auth/login`. */
export class LoginResponseDto {
  /** Token JWT firmado; incluye `sub` (id de usuario) y `role`. Expira a las 8 horas. */
  @ApiProperty({
    type: String,
    description:
      'Token de acceso JWT. Enviar como `Authorization: Bearer <token>`. Expira a las 8 horas.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjcsInJvbGUiOiJQQUNJRU5URSJ9.firma',
  })
  accessToken: string;

  /** Datos básicos del usuario autenticado. */
  @ApiProperty({
    type: LoginUserDto,
    description: 'Datos del usuario autenticado.',
  })
  user: LoginUserDto;
}
