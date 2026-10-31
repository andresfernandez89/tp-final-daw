import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

/** Cuerpo de `POST /reservations`. */
export class CreateReservationDto {
  /** Identificador del médico (`medicos.id`). */
  @ApiProperty({
    type: Number,
    format: 'int32',
    minimum: 1,
    maximum: 2147483647,
    description: 'Identificador del médico.',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  doctorId: number;

  /**
   * Inicio del turno en hora de Buenos Aires, con el formato exacto
   * `YYYY-MM-DDTHH:00:00-03:00`. Debe tomarse de la respuesta de
   * `GET /reservations/availability`.
   */
  @ApiProperty({
    type: String,
    format: 'date-time',
    description:
      'Inicio del turno en Buenos Aires, con formato YYYY-MM-DDTHH:00:00-03:00. Usar un horario de la disponibilidad.',
    example: '2026-11-10T09:00:00-03:00',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:00:00-03:00$/)
  @IsISO8601({ strict: true })
  dateTime: string;

  /**
   * Paciente para quien reserva el administrador (`usuarios.id`).
   * Obligatorio para `ADMINISTRADOR`; el `PACIENTE` sólo puede omitirlo o
   * indicar su propio id.
   */
  @ApiPropertyOptional({
    type: Number,
    format: 'int32',
    minimum: 1,
    maximum: 2147483647,
    description:
      'Paciente activo para el que reserva el administrador (obligatorio para ese rol). El paciente autenticado sólo puede reservar para sí mismo.',
    example: 7,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  patientId?: number;
}
