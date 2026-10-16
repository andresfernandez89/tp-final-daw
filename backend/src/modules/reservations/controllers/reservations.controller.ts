import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { FindAgendaQueryDto } from '../dtos/input/find-agenda-query.dto.js';
import { FindReservationsQueryDto } from '../dtos/input/find-reservations-query.dto.js';
import { OutputAgendaItemDto } from '../dtos/output/agenda-item.dto.js';
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
      'Devuelve exclusivamente las reservas del paciente autenticado: la identidad se deriva del token de acceso (usuarios.id) y no se acepta ningún identificador de paciente por parámetro. ' +
      'Los resultados se ordenan por fecha y hora ascendente y por ID como desempate. ' +
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
    return this.reservationsService.findByPatient(this.extractUserId(request));
  }

  @Get('admin')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar reservas de todos los pacientes',
    description:
      'Disponible exclusivamente para el rol ADMINISTRADOR, derivado del token de acceso. ' +
      'Permite filtrar por estado exacto (state) y por documento exacto del paciente (document); ' +
      'si se omiten ambos filtros, devuelve todas las reservas. ' +
      'El documento se compara ignorando los espacios al inicio y al final. ' +
      'Los resultados se ordenan por fecha y hora ascendente y por ID como desempate. ' +
      'Devuelve un arreglo vacío cuando ninguna reserva coincide con los filtros.',
  })
  @ApiOkResponse({
    description:
      'Listado completo de reservas que cumplen los filtros indicados.',
    type: OutputReservationDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description:
      'El estado no es uno de los valores permitidos (ACTIVO, ATENDIDO, AUSENTE o CANCELADO), ' +
      'el documento está vacío o contiene solo espacios; ' +
      'también se rechazan parámetros de consulta desconocidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'El token de acceso no fue enviado, es inválido o expiró.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene el rol ADMINISTRADOR.',
  })
  @ApiInternalServerErrorResponse({
    description: 'No se pudo obtener el listado de reservas.',
  })
  findAll(
    @Query() query: FindReservationsQueryDto,
  ): Promise<OutputReservationDto[]> {
    return this.reservationsService.findAll(query);
  }

  @Get('agenda')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.MEDICO)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar la agenda del médico autenticado',
    description:
      'Disponible exclusivamente para el rol MEDICO. ' +
      'El médico se deriva exclusivamente del token de acceso (usuarios.id); no se acepta ningún identificador de médico por parámetro. ' +
      'El parámetro obligatorio date, en formato YYYY-MM-DD, selecciona las reservas cuyo día coincide con esa fecha según la base de datos. ' +
      'Los resultados se ordenan por fecha y hora ascendente y por ID como desempate. ' +
      'Devuelve un arreglo vacío cuando el médico no tiene ficha, no tiene reservas en la fecha o la fecha no registra reservas.',
  })
  @ApiOkResponse({
    description: 'Agenda del médico autenticado para la fecha indicada.',
    type: OutputAgendaItemDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description:
      'La fecha es obligatoria, debe tener el formato YYYY-MM-DD y ser una fecha de calendario válida; ' +
      'también se rechazan parámetros de consulta desconocidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'El token de acceso no fue enviado, es inválido o expiró.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene el rol MEDICO.',
  })
  @ApiInternalServerErrorResponse({
    description: 'No se pudo obtener la agenda del médico.',
  })
  findAgenda(
    @Req() request: AuthenticatedRequest,
    @Query() query: FindAgendaQueryDto,
  ): Promise<OutputAgendaItemDto[]> {
    const doctorUserId = this.extractUserId(request);

    return this.reservationsService.findAgendaByDate(doctorUserId, query.date);
  }

  private extractUserId(request: AuthenticatedRequest): number {
    const userId = request.usuario?.sub;

    if (
      typeof userId !== 'number' ||
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new UnauthorizedException('Token de acceso inválido.');
    }

    return userId;
  }
}
