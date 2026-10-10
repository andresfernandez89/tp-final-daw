import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
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
}
