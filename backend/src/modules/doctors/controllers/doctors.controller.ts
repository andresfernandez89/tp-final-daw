import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../../common/dtos/error-response.dto.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UpdateDoctorFeeDto } from '../dtos/input/update-doctor-fee.dto.js';
import { DoctorListItemDto } from '../dtos/output/doctor-list-item.dto.js';
import { DoctorsService } from '../services/doctors.service.js';

/** Identificador mínimo aceptado para un médico. */
const DOCTOR_ID_MIN = 1;
/** Identificador máximo aceptado para un médico (límite de `integer` en PostgreSQL). */
const DOCTOR_ID_MAX = 2147483647;

/**
 * Controlador de médicos (`/api/v1/doctors`).
 *
 * Todas las operaciones requieren token JWT. El listado está disponible para
 * pacientes y administradores; la modificación del valor de consulta, sólo
 * para administradores.
 */
@ApiTags('Médicos')
@Controller('doctors')
export class DoctorsController {
  constructor(
    @Inject(DoctorsService) private readonly doctorsService: DoctorsService,
  ) {}

  /**
   * `GET /doctors` — Lista los médicos activos ordenados por id.
   *
   * Roles: `PACIENTE`, `ADMINISTRADOR`.
   *
   * @returns Médicos activos con nombre, matrícula y valor de consulta vigente.
   */
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PACIENTE, UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar médicos',
    description:
      'Devuelve los médicos activos ordenados por ID para pacientes y administradores. ' +
      'Roles autorizados: PACIENTE y ADMINISTRADOR.',
  })
  @ApiOkResponse({
    type: DoctorListItemDto,
    isArray: true,
    description: 'Listado de médicos activos.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'El token de acceso no se proporcionó o no es válido.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'El rol del usuario no tiene permiso para listar médicos.',
  })
  @ApiInternalServerErrorResponse({
    type: ErrorResponseDto,
    description: 'No se pudo obtener la lista de médicos.',
  })
  findAll(): Promise<DoctorListItemDto[]> {
    return this.doctorsService.findAll();
  }

  /**
   * `PATCH /doctors/:id/valor-consulta` — Actualiza el valor de consulta de un médico.
   *
   * Roles: `ADMINISTRADOR`. Las reservas ya creadas conservan el importe que
   * tenían al momento de reservar.
   *
   * @param id Identificador del médico (entero entre 1 y 2147483647).
   * @param body Nuevo valor de consulta.
   * @returns El médico con el valor de consulta actualizado.
   * @throws BadRequestException si el identificador está fuera de rango.
   */
  @Patch(':id/valor-consulta')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Modificar valor de consulta',
    description:
      'Actualiza únicamente el valor de consulta del médico indicado. ' +
      'Las reservas existentes conservan el importe registrado al momento de su creación. ' +
      'Rol autorizado: ADMINISTRADOR.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador del médico.',
    example: 1,
    schema: {
      type: 'integer',
      minimum: DOCTOR_ID_MIN,
      maximum: DOCTOR_ID_MAX,
    },
  })
  @ApiOkResponse({
    type: DoctorListItemDto,
    description: 'Médico con el valor de consulta actualizado.',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Identificador o datos del cuerpo inválidos o desconocidos.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Token ausente, inválido o expirado.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description:
      'El rol del usuario no tiene permiso para modificar el arancel.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El médico no existe.',
  })
  @ApiInternalServerErrorResponse({
    type: ErrorResponseDto,
    description: 'No se pudo actualizar el valor de consulta.',
  })
  async updateValorConsulta(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDoctorFeeDto,
  ): Promise<DoctorListItemDto> {
    if (!Number.isInteger(id) || id < DOCTOR_ID_MIN || id > DOCTOR_ID_MAX) {
      throw new BadRequestException(
        `El identificador del médico debe ser un entero entre ${DOCTOR_ID_MIN} y ${DOCTOR_ID_MAX}.`,
      );
    }

    return this.doctorsService.updateValorConsulta(id, body.valor_consulta);
  }
}
