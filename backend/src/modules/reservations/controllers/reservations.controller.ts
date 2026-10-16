import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import type { Request } from 'express';
import { UpdateReservationAttendanceDto } from '../dtos/input/update-reservation-attendance.dto.js';
import { OutputReservationDto } from '../dtos/output/reservation.dto.js';
import { ReservationsService } from '../services/reservations.service.js';
import type { ReservationActor } from '../services/reservations.service.js';

@ApiTags('Reservas')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Patch(':id/cancel')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PACIENTE, UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancelar una reserva',
    description:
      'Paciente: sólo reservas propias hasta el día calendario anterior en Buenos Aires. ' +
      'Administrador: antes del inicio. Sólo ACTIVO pasa a CANCELADO. ' +
      'Repetir una cancelación autorizada devuelve éxito sin cambios, incluso fuera del plazo.',
  })
  @ApiParam({ name: 'id', schema: { type: 'integer', minimum: 1 } })
  @ApiOkResponse({
    type: OutputReservationDto,
    description: 'Reserva cancelada o ya cancelada.',
  })
  @ApiBadRequestResponse({
    description: 'Identificador inválido o plazo de cancelación vencido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Rol no autorizado o reserva de otro paciente.',
  })
  @ApiNotFoundResponse({ description: 'La reserva no existe.' })
  @ApiConflictResponse({ description: 'La reserva está ATENDIDO o AUSENTE.' })
  @ApiInternalServerErrorResponse({
    description: 'Error de persistencia o validación de salida.',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { usuario: ReservationActor },
  ): Promise<OutputReservationDto> {
    return this.reservationsService.cancel(id, request.usuario);
  }

  @Patch(':id/attendance')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.MEDICO)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar atención o ausencia de una reserva propia',
    description:
      'Desde el inicio inclusive. ACTIVO pasa a ATENDIDO o AUSENTE; se permite corregir ' +
      'ATENDIDO a AUSENTE y AUSENTE a ATENDIDO. CANCELADO no se puede modificar. ' +
      'Repetir el mismo estado autorizado devuelve éxito sin escritura ni límite temporal.',
  })
  @ApiParam({ name: 'id', schema: { type: 'integer', minimum: 1 } })
  @ApiOkResponse({
    type: OutputReservationDto,
    description: 'Reserva actualizada o ya en ese estado.',
  })
  @ApiBadRequestResponse({
    description:
      'Identificador o DTO inválido, campos desconocidos o consulta no iniciada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Rol no autorizado o reserva de otro médico.',
  })
  @ApiNotFoundResponse({ description: 'La reserva no existe.' })
  @ApiConflictResponse({
    description: 'Transición incompatible con el estado persistido.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error de persistencia o validación de salida.',
  })
  markAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { usuario: ReservationActor },
    @Body() input: UpdateReservationAttendanceDto,
  ): Promise<OutputReservationDto> {
    return this.reservationsService.markAttendance(id, request.usuario, input);
  }

  @Get('availability')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PACIENTE, UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar disponibilidad de reservas',
    description:
      'La consulta de disponibilidad está pendiente de implementación; este endpoint devuelve actualmente una lista vacía.',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({
    description: 'El token de acceso no se proporcionó o no es válido.',
  })
  @ApiForbiddenResponse({
    description:
      'El rol del usuario no tiene permiso para consultar la disponibilidad.',
  })
  findAvailability(): [] {
    return [];
  }
}
