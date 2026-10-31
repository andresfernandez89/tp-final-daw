import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ReservationState } from '../../enums/reservation-state.enum.js';

/** Parámetros de consulta de `GET /reservations/admin`. Ambos filtros son opcionales y se combinan. */
export class FindReservationsQueryDto {
  /** Estado exacto por el que filtrar. Si se omite, se incluyen todos los estados. */
  @ApiPropertyOptional({
    enum: ReservationState,
    enumName: 'ReservationState',
    description:
      'Estado exacto por el que se filtran las reservas. Valores permitidos: ' +
      'ACTIVO, ATENDIDO, AUSENTE o CANCELADO. Si se omite, se listan las reservas ' +
      'de todos los estados.',
    example: ReservationState.ACTIVO,
  })
  @IsOptional()
  @IsEnum(ReservationState)
  state?: ReservationState;

  /** Documento exacto del paciente (se recortan espacios). Si se omite, se incluyen todos los pacientes. */
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
