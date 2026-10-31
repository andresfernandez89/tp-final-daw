import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
import { ErrorResponseDto } from '../../../common/dtos/error-response.dto.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { FindPatientsQueryDto } from '../dtos/input/find-patients-query.dto.js';
import { PatientDto } from '../dtos/output/patient.dto.js';
import { PatientsService } from '../services/patients.service.js';

/**
 * Controlador de pacientes (`/api/v1/patients`).
 *
 * Todas las operaciones requieren token JWT y rol `ADMINISTRADOR`; los guards
 * y el decorador de roles se aplican a nivel de clase.
 */
@ApiTags('Pacientes')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRADOR)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * `GET /patients` — Lista los pacientes activos, opcionalmente filtrados por
   * documento exacto.
   *
   * @param query Filtro opcional por documento.
   * @returns Pacientes activos ordenados por apellido y nombre.
   */
  @Get()
  @ApiOperation({
    summary: 'Consultar pacientes activos',
    description:
      'Permite a un administrador listar pacientes activos o buscar por documento exacto. ' +
      'El documento se consulta sin espacios al inicio ni al final. ' +
      'Los resultados se ordenan por apellido y nombre. ' +
      'Devuelve un arreglo vacío cuando no hay coincidencias. ' +
      'Rol autorizado: ADMINISTRADOR.',
  })
  @ApiOkResponse({
    description: 'Lista de pacientes activos que cumplen el filtro indicado.',
    type: PatientDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'El documento está vacío, contiene solo espacios o se envió más de una vez; ' +
      'también se rechazan parámetros de consulta desconocidos.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'El token de acceso no fue enviado, es inválido o expiró.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'El usuario autenticado no tiene el rol ADMINISTRADOR.',
  })
  @ApiInternalServerErrorResponse({
    type: ErrorResponseDto,
    description:
      'No se pudo consultar la base de datos o validar los datos de respuesta.',
  })
  findPatients(@Query() query: FindPatientsQueryDto): Promise<PatientDto[]> {
    return this.patientsService.findPatients(query.document);
  }
}
