import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { toReservationDto } from '../adapters/reservation.adapter.js';
import { UpdateReservationAttendanceDto } from '../dtos/input/update-reservation-attendance.dto.js';
import { OutputReservationDto } from '../dtos/output/reservation.dto.js';
import { ReservationState } from '../enums/reservation-state.enum.js';
import {
  assertAttendanceTime,
  assertCancellationTime,
  CLINIC_TIME_ZONE,
} from '../policies/reservation-time.policy.js';

export type ReservationActor = { sub: number; role: UserRole };

type LockedReservation = OutputReservationDto & { doctorUserId: number };

@Injectable()
export class ReservationsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

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
}
