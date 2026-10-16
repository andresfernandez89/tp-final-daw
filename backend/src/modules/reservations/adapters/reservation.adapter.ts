import { InternalServerErrorException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { OutputReservationDto } from '../dtos/output/reservation.dto.js';

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
