import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { DoctorListItemDto } from '../dtos/output/doctor-list-item.dto.js';
import { DoctorsService } from '../services/doctors.service.js';

@Controller('doctors')
export class DoctorsController {
  constructor(
    @Inject(DoctorsService) private readonly doctorsService: DoctorsService,
  ) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PACIENTE, UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOkResponse({ type: DoctorListItemDto })
  findAll(): Promise<DoctorListItemDto[]> {
    return this.doctorsService.findAll();
  }
}
