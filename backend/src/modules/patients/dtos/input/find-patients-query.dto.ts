import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

/** Parámetros de consulta de `GET /patients`. */
export class FindPatientsQueryDto {
  /**
   * Documento del paciente para una búsqueda exacta. Si se omite, se listan
   * todos los pacientes activos. No puede ser vacío ni sólo espacios.
   */
  @ApiPropertyOptional({
    description:
      'Documento del paciente para una búsqueda exacta. Se ignoran los espacios ' +
      'al inicio y al final. Si se omite, se listan todos los pacientes activos.',
    example: '30000001',
    minLength: 1,
    pattern: '\\S',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'El documento no puede estar vacío.' })
  document?: string;
}
