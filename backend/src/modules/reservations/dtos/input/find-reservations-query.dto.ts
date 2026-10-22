import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ReservationState } from '../../enums/reservation-state.enum.js';

export class FindReservationsQueryDto {
  @ApiPropertyOptional({
    enum: ReservationState,
    description:
      'Estado exacto por el que se filtran las reservas. Valores permitidos: ' +
      'ACTIVO, ATENDIDO, AUSENTE o CANCELADO. Si se omite, se listan las reservas ' +
      'de todos los estados.',
    example: ReservationState.ACTIVO,
  })
  @IsOptional()
  @IsEnum(ReservationState)
  state?: ReservationState;

  @ApiPropertyOptional({
    description:
      'Documento del paciente para una búsqueda exacta. Se ignoran los espacios ' +
      'al inicio y al final. Si se omite, se listan las reservas de todos los pacientes.',
    example: '30000001',
    minLength: 1,
    pattern: '\\S',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'El documento no puede estar vacío.' })
  document?: string;
}
