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
import {
  assertAttendanceTime,
  assertCancellationTime,
  CLINIC_TIME_ZONE,
} from '../policies/reservation-time.policy.js';

export type ReservationActor = { sub: number; role: UserRole };

type LockedReservation = OutputReservationDto & { doctorUserId: number };

const APPOINTMENT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15];

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
      const [reservation] = await manager.query<LockedReservation[]>(
        `SELECT r.id, r.id_medico AS "doctorId", r.id_paciente AS "patientId",
                r.fecha_hora AT TIME ZONE $2 AS "dateTime", r.estado AS state,
                r.valor_consulta AS "consultationFee", m.id_usuario AS "doctorUserId"
         FROM reservas r
         INNER JOIN medicos m ON m.id = r.id_medico
         WHERE r.id = $1
         FOR UPDATE OF r`,
        [id, CLINIC_TIME_ZONE],
      );

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

      const [{ now }] = await manager.query<{ now: Date }[]>(
        'SELECT clock_timestamp() AS now',
      );
      if (target === ReservationState.CANCELADO) {
        assertCancellationTime(
          reservation.dateTime,
          now,
          actor.role as UserRole.PACIENTE | UserRole.ADMINISTRADOR,
        );
      } else {
        assertAttendanceTime(reservation.dateTime, now);
      }

      await manager.query('UPDATE reservas SET estado = $2 WHERE id = $1', [
        id,
        target,
      ]);

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
