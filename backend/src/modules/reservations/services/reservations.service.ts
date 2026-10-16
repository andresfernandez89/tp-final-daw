import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { FindReservationsQueryDto } from '../dtos/input/find-reservations-query.dto.js';
import { OutputAgendaItemDto } from '../dtos/output/agenda-item.dto.js';
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

  async findAll(
    filters: FindReservationsQueryDto,
  ): Promise<OutputReservationDto[]> {
    try {
      const query = this.reservationsRepository
        .createQueryBuilder('r')
        .leftJoin('r.paciente', 'p')
        .orderBy('r.fecha_hora', 'ASC')
        .addOrderBy('r.id', 'ASC');

      if (filters.state !== undefined) {
        query.andWhere('r.estado = :state', { state: filters.state });
      }

      if (filters.document !== undefined) {
        query.andWhere('p.documento = :document', {
          document: filters.document.trim(),
        });
      }

      const reservations = await query.getMany();

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

  async findAgendaByDate(
    doctorUserId: number,
    date: string,
  ): Promise<OutputAgendaItemDto[]> {
    try {
      const reservations = await this.reservationsRepository
        .createQueryBuilder('r')
        .innerJoin('r.medico', 'm')
        .innerJoinAndSelect('r.paciente', 'p')
        .where('m.id_usuario = :doctorUserId', { doctorUserId })
        .andWhere('DATE(r.fecha_hora) = :date', { date })
        .orderBy('r.fecha_hora', 'ASC')
        .addOrderBy('r.id', 'ASC')
        .getMany();

      return reservations.map((reservation) => {
        const item = Object.assign(new OutputAgendaItemDto(), {
          id: reservation.id,
          dateTime: reservation.fecha_hora,
          state: reservation.estado,
          patientId: reservation.id_paciente,
          patientDocument: reservation.paciente.documento,
          patientFirstName: reservation.paciente.nombres,
          patientLastName: reservation.paciente.apellidos,
          consultationFee: reservation.valor_consulta,
        });

        return item;
      });
    } catch {
      throw new InternalServerErrorException(
        'No se pudo obtener la agenda del médico.',
      );
    }
  }
}
