import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { And, LessThan, MoreThanOrEqual, Not, type Repository } from 'typeorm';
import { DoctorsService } from '../../doctors/services/doctors.service.js';
import { FindAvailabilityQueryDto } from '../dtos/input/find-availability-query.dto.js';
import { FindReservationsQueryDto } from '../dtos/input/find-reservations-query.dto.js';
import { OutputAgendaItemDto } from '../dtos/output/agenda-item.dto.js';
import { AvailabilitySlotDto } from '../dtos/output/availability-slot.dto.js';
import { OutputReservationDto } from '../dtos/output/reservation.dto.js';
import { Reservation } from '../entities/reservation.entity.js';
import { ReservationState } from '../enums/reservation-state.enum.js';

const CLINIC_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const APPOINTMENT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15];

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
    private readonly doctorsService: DoctorsService,
  ) {}

  async findByPatient(patientId: number): Promise<OutputReservationDto[]> {
    try {
      const reservations = await this.reservationsRepository.find({
        where: { id_paciente: patientId },
        order: { fecha_hora: 'ASC', id: 'ASC' },
      });

      return await Promise.all(
        reservations.map((reservation) =>
          this.toReservationAdapter(reservation),
        ),
      );
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

      return await Promise.all(
        reservations.map((reservation) =>
          this.toReservationAdapter(reservation),
        ),
      );
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

      return await Promise.all(
        reservations.map((reservation) =>
          this.toAgendaItemAdapter(reservation),
        ),
      );
    } catch {
      throw new InternalServerErrorException(
        'No se pudo obtener la agenda del médico.',
      );
    }
  }

  async findAvailability(
    query: FindAvailabilityQueryDto,
  ): Promise<AvailabilitySlotDto[]> {
    const clock = this.getClinicClock();
    if (
      query.date < clock.date ||
      query.date > this.addCalendarDays(clock.date, 30)
    ) {
      throw new BadRequestException(
        'La fecha debe estar entre hoy y los próximos 30 días inclusive, según la hora de Argentina.',
      );
    }

    try {
      await this.doctorsService.findActiveById(query.doctorId);

      const dayStart = new Date(`${query.date}T00:00:00`);
      const dayEnd = new Date(
        `${this.addCalendarDays(query.date, 1)}T00:00:00`,
      );
      const occupied = await this.reservationsRepository.find({
        select: { fecha_hora: true },
        where: {
          id_medico: query.doctorId,
          estado: Not(ReservationState.CANCELADO),
          fecha_hora: And(MoreThanOrEqual(dayStart), LessThan(dayEnd)),
        },
      });
      const occupiedHours = occupied.map((reservation) =>
        reservation.fecha_hora.getHours(),
      );

      const freeHours = APPOINTMENT_HOURS.filter((hour) => {
        if (query.date === clock.date && hour <= clock.hour) return false;
        return !occupiedHours.includes(hour);
      });

      const slots: AvailabilitySlotDto[] = [];
      for (const hour of freeHours) {
        const slot = new AvailabilitySlotDto();
        slot.dateTime = `${query.date}T${String(hour).padStart(2, '0')}:00:00-03:00`;
        slots.push(slot);
      }

      await Promise.all(slots.map((slot) => validateOrReject(slot)));
      return slots;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'No se pudo obtener la disponibilidad de reservas.',
      );
    }
  }

  private async toReservationAdapter(
    reservation: Reservation,
  ): Promise<OutputReservationDto> {
    const item = plainToInstance(OutputReservationDto, {
      id: reservation.id,
      doctorId: reservation.id_medico,
      patientId: reservation.id_paciente,
      dateTime: reservation.fecha_hora,
      state: reservation.estado,
      consultationFee: reservation.valor_consulta,
    });

    await validateOrReject(item);

    return item;
  }

  private async toAgendaItemAdapter(
    reservation: Reservation,
  ): Promise<OutputAgendaItemDto> {
    const item = plainToInstance(OutputAgendaItemDto, {
      id: reservation.id,
      dateTime: reservation.fecha_hora,
      state: reservation.estado,
      patientId: reservation.id_paciente,
      patientDocument: reservation.paciente.documento,
      patientFirstName: reservation.paciente.nombres,
      patientLastName: reservation.paciente.apellidos,
      consultationFee: reservation.valor_consulta,
    });

    await validateOrReject(item);

    return item;
  }

  private getClinicClock(): { date: string; hour: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: CLINIC_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const values = Object.fromEntries(
      parts.map(({ type, value }) => [type, value]),
    );
    return {
      date: `${values.year}-${values.month}-${values.day}`,
      hour: Number(values.hour),
    };
  }

  private addCalendarDays(date: string, days: number): string {
    const calendar = new Date(`${date}T00:00:00Z`);
    calendar.setUTCDate(calendar.getUTCDate() + days);
    return calendar.toISOString().slice(0, 10);
  }
}
