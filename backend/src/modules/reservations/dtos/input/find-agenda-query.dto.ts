import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsString, Matches } from 'class-validator';

/** Parámetros de consulta de `GET /reservations/agenda`. */
export class FindAgendaQueryDto {
  /** Fecha de la agenda (`YYYY-MM-DD`); obligatoria y debe ser una fecha de calendario válida. */
  @ApiProperty({
    description:
      'Fecha de la agenda en formato YYYY-MM-DD. Debe ser una fecha de calendario válida.',
    example: '2026-10-16',
    format: 'date',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener el formato YYYY-MM-DD.',
  })
  @IsISO8601(
    { strict: true },
    {
      message: 'La fecha debe ser una fecha de calendario válida.',
    },
  )
  date: string;
}
