import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsString, Matches, Min } from 'class-validator';

/** Parámetros de consulta de `GET /reservations/availability`. */
export class FindAvailabilityQueryDto {
  /** Identificador del médico (`medicos.id`). Se convierte de texto a número. */
  @ApiProperty({
    type: Number,
    format: 'int32',
    minimum: 1,
    description: 'Identificador del médico.',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctorId: number;

  /** Fecha a consultar (`YYYY-MM-DD`), entre hoy y 30 días en adelante según la hora de Argentina. */
  @ApiProperty({
    type: String,
    format: 'date',
    description:
      'Fecha de calendario en formato YYYY-MM-DD, desde hoy hasta los próximos 30 días inclusive, según la hora de Argentina.',
    example: '2026-11-10',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  date: string;
}
