import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

/**
 * Médico tal como lo devuelve la API: datos de la ficha (`medicos`) más el
 * nombre tomado del usuario asociado.
 */
export class DoctorListItemDto {
  /** Identificador del médico en la tabla `medicos` (no el id de usuario). */
  @ApiProperty({
    type: 'integer',
    description: 'Identificador del médico en la tabla medicos.',
    example: 1,
  })
  @IsInt()
  id: number;

  /** Nombres del médico. */
  @ApiProperty({ description: 'Nombres del médico.', example: 'Uno' })
  @IsString()
  nombres: string;

  /** Apellidos del médico. */
  @ApiProperty({ description: 'Apellidos del médico.', example: 'Medico' })
  @IsString()
  apellidos: string;

  /** Número de matrícula profesional. */
  @ApiProperty({
    type: 'integer',
    description: 'Número de matrícula profesional.',
    example: 10001,
  })
  @IsInt()
  matricula: number;

  /** Valor de consulta vigente, en pesos argentinos. */
  @ApiProperty({
    type: 'integer',
    description: 'Valor de consulta vigente en pesos argentinos.',
    example: 15000,
  })
  @IsInt()
  valor_consulta: number;
}
