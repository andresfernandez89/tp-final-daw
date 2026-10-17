import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ReservationState } from '../../enums/reservation-state.enum.js';

export class UpdateReservationAttendanceDto {
  @ApiProperty({
    enum: [ReservationState.ATENDIDO, ReservationState.AUSENTE],
    description: 'Resultado de la consulta, indicado por el médico asignado.',
  })
  @IsIn([ReservationState.ATENDIDO, ReservationState.AUSENTE])
  state: ReservationState.ATENDIDO | ReservationState.AUSENTE;
}
