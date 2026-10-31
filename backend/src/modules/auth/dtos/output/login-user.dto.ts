import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsInt } from 'class-validator';
import { UserRole } from '../../enums/user-role.enum.js';

/** Datos del usuario que acompañan al token en la respuesta de inicio de sesión. */
export class LoginUserDto {
  /** Identificador del usuario en la tabla `usuarios`. */
  @ApiProperty({
    type: 'integer',
    description: 'Identificador del usuario en la tabla usuarios.',
    example: 7,
  })
  @IsInt()
  id: number;

  /** Correo electrónico del usuario. */
  @ApiProperty({
    type: String,
    format: 'email',
    description: 'Correo electrónico del usuario.',
    example: 'paciente1@example.com',
  })
  @IsEmail()
  email: string;

  /** Rol del usuario; determina qué operaciones puede ejecutar. */
  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    description: 'Rol del usuario.',
    example: UserRole.PACIENTE,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
