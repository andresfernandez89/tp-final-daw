import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsString } from 'class-validator';

export class AvailabilitySlotDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    description:
      'Inicio de un turno disponible de una hora, en formato ISO 8601 con el desplazamiento horario de Argentina (-03:00).',
  })
  @IsString()
  @IsISO8601({ strict: true })
  dateTime: string;
}
