import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsInt } from 'class-validator';
import { ReservationState } from '../../enums/reservation-state.enum.js';

/** Reserva tal como la devuelve la API en creación, cancelación, atención y listados. */
export class OutputReservationDto {
  /** Identificador de la reserva. */
  @ApiProperty({
    type: 'integer',
    description: 'Identificador de la reserva.',
    example: 12,
  })
  @IsInt()
  id: number;

  /** Identificador del médico (`medicos.id`). */
  @ApiProperty({
    type: 'integer',
    description: 'Identificador del médico en la tabla medicos.',
    example: 1,
  })
  @IsInt()
  doctorId: number;

  /** Identificador del paciente (`usuarios.id`). */
  @ApiProperty({
    type: 'integer',
    description: 'Identificador del paciente en la tabla usuarios.',
    example: 7,
  })
  @IsInt()
  patientId: number;

  /** Inicio del turno, en hora de Buenos Aires. */
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de la consulta reservada.',
    example: '2026-11-10T12:00:00.000Z',
  })
  @IsDate()
  dateTime: Date;

  /** Estado de la reserva. */
  @ApiProperty({
    enum: ReservationState,
    enumName: 'ReservationState',
    description: 'Estado de la reserva.',
    example: ReservationState.ACTIVO,
  })
  @IsEnum(ReservationState)
  state: ReservationState;

  /** Valor de consulta congelado al reservar, en pesos argentinos. */
  @ApiProperty({
    type: 'integer',
    description: 'Valor de la consulta registrado en la reserva.',
    example: 15000,
  })
  @IsInt()
  consultationFee: number;
}
