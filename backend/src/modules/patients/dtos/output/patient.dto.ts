import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

/** Paciente tal como lo devuelve la API (proyección de un usuario con rol `PACIENTE`). */
export class PatientDto {
  /** Identificador del paciente; coincide con `usuarios.id`. */
  @ApiProperty({
    description: 'Identificador del paciente en la tabla usuarios.',
    type: 'integer',
    example: 7,
  })
  @IsInt()
  id: number;

  /** Documento del paciente. */
  @ApiProperty({
    description: 'Documento del paciente.',
    example: '30000001',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  /** Nombres del paciente. */
  @ApiProperty({
    description: 'Nombres del paciente.',
    example: 'Uno',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  /** Apellidos del paciente. */
  @ApiProperty({
    description: 'Apellidos del paciente.',
    example: 'Paciente',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
