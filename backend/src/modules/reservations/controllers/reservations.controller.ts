import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.js';
import { CreateReservationDto } from '../dtos/input/create-reservation.dto.js';
import { FindAgendaQueryDto } from '../dtos/input/find-agenda-query.dto.js';
import { FindAvailabilityQueryDto } from '../dtos/input/find-availability-query.dto.js';
import { FindReservationsQueryDto } from '../dtos/input/find-reservations-query.dto.js';
import { UpdateReservationAttendanceDto } from '../dtos/input/update-reservation-attendance.dto.js';
import { OutputAgendaItemDto } from '../dtos/output/agenda-item.dto.js';
import { AvailabilitySlotDto } from '../dtos/output/availability-slot.dto.js';
import { OutputReservationDto } from '../dtos/output/reservation.dto.js';
import { ReservationsService } from '../services/reservations.service.js';

interface AuthenticatedRequest extends Request {
  usuario: AuthenticatedUser;
}

@ApiTags('Reservas')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PACIENTE, UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una reserva',
    description:
      'El paciente reserva para sí mismo; el administrador debe indicar patientId. ' +
      'Usar dateTime de la disponibilidad (Buenos Aires, -03:00). ' +
      'Turnos futuros de una hora, de 08:00 a 15:00, hasta 30 días inclusive. ' +
      'El servidor asigna ACTIVO y congela el precio actual del médico.',
  })
  @ApiCreatedResponse({
    type: OutputReservationDto,
    description: 'Reserva creada.',
  })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos, horario fuera de rango o falta patientId para el administrador.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'Rol no autorizado o paciente intentando reservar para otra persona.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un médico o paciente activo.',
  })
  @ApiConflictResponse({
    description: 'El horario seleccionado ya está ocupado.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error de persistencia o validación de salida.',
  })
  create(
    @Body() input: CreateReservationDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<OutputReservationDto> {
    return this.reservationsService.create(input, request.usuario);
  }

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
    @Req() request: AuthenticatedRequest,
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
    @Req() request: AuthenticatedRequest,
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
    return this.reservationsService.findByPatient(request.usuario.sub);
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
    return this.reservationsService.findAgendaByDate(
      request.usuario.sub,
      query.date,
    );
  }
}
