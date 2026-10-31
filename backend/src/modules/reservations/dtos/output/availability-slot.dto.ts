import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsString } from 'class-validator';

/** Turno libre devuelto por `GET /reservations/availability`. */
export class AvailabilitySlotDto {
  /**
   * Inicio del turno libre, en formato `YYYY-MM-DDTHH:00:00-03:00`. Es el
   * valor que debe enviarse como `dateTime` al crear la reserva.
   */
  @ApiProperty({
    type: String,
    format: 'date-time',
    description:
      'Inicio de un turno disponible de una hora, en formato ISO 8601 con el desplazamiento horario de Argentina (-03:00).',
    example: '2026-11-10T09:00:00-03:00',
  })
  @IsString()
  @IsISO8601({ strict: true })
  dateTime: string;
}
