import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ReservationState } from '../../enums/reservation-state.enum.js';

/**
 * Turno de la agenda del médico (`GET /reservations/agenda`): la reserva más
 * los datos del paciente, para mostrarla sin consultas adicionales.
 */
export class OutputAgendaItemDto {
  /** Identificador de la reserva. */
  @ApiProperty({
    type: 'integer',
    description: 'Identificador de la reserva.',
    example: 12,
  })
  @IsInt()
  id: number;

  /** Inicio del turno, en hora de Buenos Aires. */
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de la consulta reservada.',
    example: '2026-10-16T12:00:00.000Z',
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

  /** Identificador del paciente (`usuarios.id`). */
  @ApiProperty({
    type: 'integer',
    description: 'Identificador del paciente en la tabla usuarios.',
    example: 7,
  })
  @IsInt()
  patientId: number;

  /** Documento del paciente. */
  @ApiProperty({
    type: String,
    description: 'Documento del paciente.',
    example: '30000001',
  })
  @IsString()
  @IsNotEmpty()
  patientDocument: string;

  /** Nombres del paciente. */
  @ApiProperty({
    type: String,
    description: 'Nombres del paciente.',
    example: 'Uno',
  })
  @IsString()
  @IsNotEmpty()
  patientFirstName: string;

  /** Apellidos del paciente. */
  @ApiProperty({
    type: String,
    description: 'Apellidos del paciente.',
    example: 'Paciente',
  })
  @IsString()
  @IsNotEmpty()
  patientLastName: string;

  /** Valor de consulta congelado en la reserva, en pesos argentinos. */
  @ApiProperty({
    type: 'integer',
    description: 'Valor de la consulta registrado en la reserva.',
    example: 15000,
  })
  @IsInt()
  consultationFee: number;
}
