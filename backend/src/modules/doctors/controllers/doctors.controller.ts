import {
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
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UpdateDoctorFeeDto } from '../dtos/input/update-doctor-fee.dto.js';
import { DoctorListItemDto } from '../dtos/output/doctor-list-item.dto.js';
import { DoctorsService } from '../services/doctors.service.js';

@ApiTags('Médicos')
@Controller('doctors')
export class DoctorsController {
  constructor(
    @Inject(DoctorsService) private readonly doctorsService: DoctorsService,
  ) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PACIENTE, UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar médicos',
    description:
      'Devuelve los médicos activos ordenados por ID para pacientes y administradores.',
  })
  @ApiOkResponse({ type: DoctorListItemDto, isArray: true })
  @ApiUnauthorizedResponse({
    description: 'El token de acceso no se proporcionó o no es válido.',
  })
  @ApiForbiddenResponse({
    description: 'El rol del usuario no tiene permiso para listar médicos.',
  })
  @ApiInternalServerErrorResponse({
    description: 'No se pudo obtener la lista de médicos.',
  })
  findAll(): Promise<DoctorListItemDto[]> {
    return this.doctorsService.findAll();
  }

  @Patch(':id/valor-consulta')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Modificar valor de consulta',
    description:
      'Actualiza únicamente el valor de consulta del médico indicado. ' +
      'Las reservas existentes conservan el importe registrado al momento de su creación.',
  })
  @ApiParam({ name: 'id', schema: { type: 'integer', minimum: 1 } })
  @ApiOkResponse({
    type: DoctorListItemDto,
    description: 'Médico con el valor de consulta actualizado.',
  })
  @ApiBadRequestResponse({
    description:
      'Identificador o datos del cuerpo inválidos o desconocidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado.',
  })
  @ApiForbiddenResponse({
    description: 'El rol del usuario no tiene permiso para modificar el arancel.',
  })
  @ApiNotFoundResponse({
    description: 'El médico no existe.',
  })
  @ApiInternalServerErrorResponse({
    description: 'No se pudo actualizar el valor de consulta.',
  })
  async updateValorConsulta(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDoctorFeeDto,
  ): Promise<DoctorListItemDto> {
    return this.doctorsService.updateValorConsulta(id, body.valor_consulta);
  }
}
