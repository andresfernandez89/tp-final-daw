import { BadRequestException } from '@nestjs/common';
import { UserRole } from '../../auth/enums/user-role.enum.js';

export const CLINIC_TIME_ZONE = 'America/Argentina/Buenos_Aires';

const calendarDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function assertCancellationTime(
  start: Date,
  now: Date,
  role: UserRole.PACIENTE | UserRole.ADMINISTRADOR,
): void {
  if (role === UserRole.PACIENTE) {
    if (calendarDate.format(now) >= calendarDate.format(start)) {
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
