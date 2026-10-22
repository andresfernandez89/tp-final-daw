import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({
    type: Number,
    format: 'int32',
    minimum: 1,
    maximum: 2147483647,
    description: 'Identificador del médico.',
  })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  doctorId: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description:
      'Inicio del turno en Buenos Aires, con formato YYYY-MM-DDTHH:00:00-03:00. Usar un horario de la disponibilidad.',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:00:00-03:00$/)
  @IsISO8601({ strict: true })
  dateTime: string;

  @ApiPropertyOptional({
    type: Number,
    format: 'int32',
    minimum: 1,
    maximum: 2147483647,
    description:
      'Paciente activo para el que reserva el administrador (obligatorio para ese rol). El paciente autenticado sólo puede reservar para sí mismo.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  patientId?: number;
}
