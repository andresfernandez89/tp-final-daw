import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { validateOrReject } from 'class-validator';
import {
  And,
  DataSource,
  LessThan,
  MoreThanOrEqual,
  Not,
  type Repository,
} from 'typeorm';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { DoctorsService } from '../../doctors/services/doctors.service.js';
import { toReservationDto } from '../adapters/reservation.adapter.js';
import { FindAvailabilityQueryDto } from '../dtos/input/find-availability-query.dto.js';
import { UpdateReservationAttendanceDto } from '../dtos/input/update-reservation-attendance.dto.js';
import { AvailabilitySlotDto } from '../dtos/output/availability-slot.dto.js';
import { OutputReservationDto } from '../dtos/output/reservation.dto.js';
import { Reservation } from '../entities/reservation.entity.js';
import { ReservationState } from '../enums/reservation-state.enum.js';

export type ReservationActor = { sub: number; role: UserRole };

type LockedReservation = OutputReservationDto & { doctorUserId: number };

const APPOINTMENT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15];
const CLINIC_TIME_ZONE = 'America/Argentina/Buenos_Aires';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
    private readonly doctorsService: DoctorsService,
  ) {}

  cancel(id: number, actor: ReservationActor): Promise<OutputReservationDto> {
    if (![UserRole.PACIENTE, UserRole.ADMINISTRADOR].includes(actor.role)) {
      throw new ForbiddenException(
        'El rol no tiene permiso para cancelar reservas.',
      );
    }
    return this.changeState(id, actor, ReservationState.CANCELADO);
  }

  markAttendance(
    id: number,
    actor: ReservationActor,
    input: UpdateReservationAttendanceDto,
  ): Promise<OutputReservationDto> {
    if (actor.role !== UserRole.MEDICO) {
      throw new ForbiddenException(
        'Sólo el médico asignado puede registrar la atención.',
      );
    }
    if (
      ![ReservationState.ATENDIDO, ReservationState.AUSENTE].includes(
        input.state,
      )
    ) {
      throw new BadRequestException('El estado debe ser ATENDIDO o AUSENTE.');
    }
    return this.changeState(id, actor, input.state);
  }

  private async changeState(
    id: number,
    actor: ReservationActor,
    target: ReservationState,
  ): Promise<OutputReservationDto> {
    if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
      throw new BadRequestException(
        'El identificador de reserva debe ser un entero positivo válido.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // El timestamp existente es una hora de pared de la clínica, no del proceso Node.
      // El lock se toma antes de leer estado y reloj para revalidar luego de cualquier espera.
      const reservation = await manager
        .createQueryBuilder(Reservation, 'reserva')
        .select('reserva.id', 'id')
        .addSelect('reserva.id_medico', 'doctorId')
        .addSelect('reserva.id_paciente', 'patientId')
        .addSelect(
          'reserva.fecha_hora AT TIME ZONE :clinicTimeZone',
          'dateTime',
        )
        .addSelect('reserva.estado', 'state')
        .addSelect('reserva.valor_consulta', 'consultationFee')
        .addSelect('medico.id_usuario', 'doctorUserId')
        .innerJoin('reserva.medico', 'medico')
        .where({ id })
        .setParameter('clinicTimeZone', CLINIC_TIME_ZONE)
        .setLock('pessimistic_write', undefined, ['reserva'])
        .getRawOne<LockedReservation>();

      if (!reservation) {
        throw new NotFoundException('No se encontró la reserva.');
      }

      if (
        (actor.role === UserRole.PACIENTE &&
          reservation.patientId !== actor.sub) ||
        (actor.role === UserRole.MEDICO &&
          reservation.doctorUserId !== actor.sub)
      ) {
        throw new ForbiddenException(
          'La reserva no pertenece al usuario autenticado.',
        );
      }

      // Reintentos autorizados no escriben ni vuelven a aplicar plazos de una mutación.
      if (reservation.state === target) {
        return toReservationDto(reservation);
      }

      const isCorrection =
        (reservation.state === ReservationState.ATENDIDO &&
          target === ReservationState.AUSENTE) ||
        (reservation.state === ReservationState.AUSENTE &&
          target === ReservationState.ATENDIDO);
      if (reservation.state !== ReservationState.ACTIVO && !isCorrection) {
        throw new ConflictException(
          'La transición de estado solicitada no está permitida.',
        );
      }

      const clock = await manager
        .createQueryBuilder(Reservation, 'reserva')
        .select('clock_timestamp()', 'now')
        .where({ id })
        .getRawOne<{ now: Date }>();
      if (!clock) {
        throw new InternalServerErrorException(
          'No se pudo actualizar el estado de la reserva.',
        );
      }
      const { now } = clock;
      if (target === ReservationState.CANCELADO) {
        this.assertCancellationTime(
          reservation.dateTime,
          now,
          actor.role as UserRole.PACIENTE | UserRole.ADMINISTRADOR,
        );
      } else {
        this.assertAttendanceTime(reservation.dateTime, now);
      }

      const result = await manager
        .createQueryBuilder()
        .update(Reservation)
        .set({ estado: target })
        .where({ id })
        .returning(['estado'])
        .execute();
      if (result.affected !== 1 || result.raw[0]?.estado !== target) {
        throw new InternalServerErrorException(
          'No se pudo actualizar el estado de la reserva.',
        );
      }

      // Validar antes del commit: una salida inválida tampoco deja un cambio persistido.
      return toReservationDto({ ...reservation, state: target });
    });
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

  private assertCancellationTime(
    start: Date,
    now: Date,
    role: UserRole.PACIENTE | UserRole.ADMINISTRADOR,
  ): void {
    if (role === UserRole.PACIENTE) {
      if (this.calendarDate(now) >= this.calendarDate(start)) {
        throw new BadRequestException(
          'El paciente sólo puede cancelar hasta el día anterior a la consulta.',
        );
      }
    } else if (now.getTime() >= start.getTime()) {
      throw new BadRequestException(
        'El administrador sólo puede cancelar antes del inicio de la consulta.',
      );
    }
  }

  private assertAttendanceTime(start: Date, now: Date): void {
    if (now.getTime() < start.getTime()) {
      throw new BadRequestException(
        'La atención o ausencia sólo se puede registrar desde el inicio de la consulta.',
      );
    }
  }

  private calendarDate(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: CLINIC_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
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
