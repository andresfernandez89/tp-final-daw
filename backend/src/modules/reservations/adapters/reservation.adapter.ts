import { InternalServerErrorException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { OutputReservationDto } from '../dtos/output/reservation.dto.js';

/**
 * Construye un {@link OutputReservationDto} validado a partir de los datos
 * crudos de una reserva.
 *
 * Copia sólo los campos públicos (descarta cualquier campo interno, como
 * `doctorUserId`) y valida el resultado con class-validator, de modo que la
 * API nunca devuelva una reserva con datos inconsistentes.
 *
 * @param reservation Datos de la reserva con la forma del DTO de salida.
 * @returns El DTO validado.
 * @throws InternalServerErrorException si la validación falla.
 */
export async function toReservationDto(
  reservation: OutputReservationDto,
): Promise<OutputReservationDto> {
  const output = plainToInstance(OutputReservationDto, {
    id: reservation.id,
    doctorId: reservation.doctorId,
    patientId: reservation.patientId,
    dateTime: reservation.dateTime,
    state: reservation.state,
    consultationFee: reservation.consultationFee,
  });

  try {
    await validateOrReject(output);
  } catch {
    throw new InternalServerErrorException(
      'No se pudo validar la respuesta de la reserva.',
    );
  }

  return output;
}
