import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ReservationState } from '../../enums/reservation-state.enum.js';

/** Cuerpo de `PATCH /reservations/:id/attendance`. */
export class UpdateReservationAttendanceDto {
  /** Resultado de la consulta: `ATENDIDO` o `AUSENTE`. Otros estados se rechazan. */
  @ApiProperty({
    enum: [ReservationState.ATENDIDO, ReservationState.AUSENTE],
    description: 'Resultado de la consulta, indicado por el médico asignado.',
    example: ReservationState.ATENDIDO,
  })
  @IsIn([ReservationState.ATENDIDO, ReservationState.AUSENTE])
  state: ReservationState.ATENDIDO | ReservationState.AUSENTE;
}
