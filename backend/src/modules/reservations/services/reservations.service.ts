import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { OutputReservationDto } from '../dtos/output/reservation.dto.js';
import { Reservation } from '../entities/reservation.entity.js';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
  ) {}

  async findByPatient(patientId: number): Promise<OutputReservationDto[]> {
    try {
      const reservations = await this.reservationsRepository.find({
        where: { id_paciente: patientId },
        order: { fecha_hora: 'ASC', id: 'ASC' },
      });

      return reservations.map((reservation) => {
        const item = Object.assign(new OutputReservationDto(), {
          id: reservation.id,
          doctorId: reservation.id_medico,
          patientId: reservation.id_paciente,
          dateTime: reservation.fecha_hora,
          state: reservation.estado,
          consultationFee: reservation.valor_consulta,
        });

        return item;
      });
    } catch {
      throw new InternalServerErrorException(
        'No se pudo obtener el listado de reservas.',
      );
    }
  }
}
