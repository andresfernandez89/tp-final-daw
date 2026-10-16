import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { OutputReservationDto } from '../dtos/output/reservation.dto.js';
import { ReservationsService } from '../services/reservations.service.js';

interface AuthenticatedRequest extends Request {
  usuario?: { sub?: number };
}

@ApiTags('Reservas')
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

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

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PACIENTE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar mis reservas',
    description:
      'Devuelve exclusivamente las reservas del paciente autenticado, ordenadas por fecha y hora ascendente y por ID como desempate. ' +
      'Devuelve un arreglo vacío cuando el paciente no tiene reservas.',
  })
  @ApiOkResponse({
    description: 'Listado de reservas del paciente autenticado.',
    type: OutputReservationDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'El token de acceso no se proporcionó o no es válido.',
  })
  @ApiForbiddenResponse({
    description:
      'El rol del usuario no tiene permiso para listar sus reservas.',
  })
  @ApiInternalServerErrorResponse({
    description: 'No se pudo obtener el listado de reservas.',
  })
  findMyReservations(
    @Req() request: AuthenticatedRequest,
  ): Promise<OutputReservationDto[]> {
    const patientId = request.usuario?.sub;

    if (
      typeof patientId !== 'number' ||
      !Number.isInteger(patientId) ||
      patientId <= 0
    ) {
      throw new UnauthorizedException('Token de acceso inválido.');
    }

    return this.reservationsService.findByPatient(patientId);
  }
}
