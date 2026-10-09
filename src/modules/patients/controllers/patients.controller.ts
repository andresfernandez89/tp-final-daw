import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { FindPatientsQueryDto } from '../dtos/input/find-patients-query.dto.js';
import { PatientDto } from '../dtos/output/patient.dto.js';
import { PatientsService } from '../services/patients.service.js';

@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRADOR)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findPatients(@Query() query: FindPatientsQueryDto): Promise<PatientDto[]> {
    return this.patientsService.findPatients(query.document);
  }
}
