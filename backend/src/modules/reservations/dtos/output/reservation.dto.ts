import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsInt } from 'class-validator';
import { ReservationState } from '../../enums/reservation-state.enum.js';

export class OutputReservationDto {
  @ApiProperty({
    type: 'integer',
    description: 'Identificador de la reserva.',
  })
  @IsInt()
  id: number;

  @ApiProperty({
    type: 'integer',
    description: 'Identificador del médico en la tabla medicos.',
  })
  @IsInt()
  doctorId: number;

  @ApiProperty({
    type: 'integer',
    description: 'Identificador del paciente en la tabla usuarios.',
  })
  @IsInt()
  patientId: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha y hora de la consulta reservada.',
  })
  @IsDate()
  dateTime: Date;

  @ApiProperty({
    enum: ReservationState,
    description: 'Estado de la reserva.',
  })
  @IsEnum(ReservationState)
  state: ReservationState;

  @ApiProperty({
    type: 'integer',
    description: 'Valor de la consulta registrado en la reserva.',
  })
  @IsInt()
  consultationFee: number;
}
