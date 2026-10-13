import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { FindAvailabilityQueryDto } from '../dtos/input/find-availability-query.dto.js';
import { AvailabilitySlotDto } from '../dtos/output/availability-slot.dto.js';
import { ReservationsService } from '../services/reservations.service.js';

@ApiTags('Reservas')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('availability')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PACIENTE, UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar disponibilidad de reservas',
    description:
      'Devuelve turnos libres de una hora entre las 08:00 y las 16:00 para un médico activo, desde hoy hasta los próximos 30 días inclusive según la hora de Argentina. Excluye los inicios pasados o actuales del día de hoy.',
  })
  @ApiOkResponse({
    type: AvailabilitySlotDto,
    isArray: true,
    description:
      'Turnos disponibles; una lista vacía indica que no hay turnos libres.',
  })
  @ApiBadRequestResponse({
    description:
      'Los parámetros son inválidos o la fecha está fuera del rango permitido.',
  })
  @ApiNotFoundResponse({
    description:
      'El médico no existe, está inactivo o no tiene el rol de médico.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'No se pudo consultar o validar la disponibilidad de reservas.',
  })
  @ApiUnauthorizedResponse({
    description: 'El token de acceso no se proporcionó o no es válido.',
  })
  @ApiForbiddenResponse({
    description:
      'El rol del usuario no tiene permiso para consultar la disponibilidad.',
  })
  findAvailability(
    @Query(new ValidationPipe({ transform: true }))
    query: FindAvailabilityQueryDto,
  ): Promise<AvailabilitySlotDto[]> {
    return this.reservationsService.findAvailability(query);
  }
}
