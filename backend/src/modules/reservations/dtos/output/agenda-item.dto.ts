import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ReservationState } from '../../enums/reservation-state.enum.js';

export class OutputAgendaItemDto {
  @ApiProperty({
    type: 'integer',
    description: 'Identificador de la reserva.',
  })
  @IsInt()
  id: number;

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
    description: 'Identificador del paciente en la tabla usuarios.',
  })
  @IsInt()
  patientId: number;

  @ApiProperty({
    type: String,
    description: 'Documento del paciente.',
  })
  @IsString()
  @IsNotEmpty()
  patientDocument: string;

  @ApiProperty({
    type: String,
    description: 'Nombres del paciente.',
  })
  @IsString()
  @IsNotEmpty()
  patientFirstName: string;

  @ApiProperty({
    type: String,
    description: 'Apellidos del paciente.',
  })
  @IsString()
  @IsNotEmpty()
  patientLastName: string;

  @ApiProperty({
    type: 'integer',
    description: 'Valor de la consulta registrado en la reserva.',
  })
  @IsInt()
  consultationFee: number;
}
