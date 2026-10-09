import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';

@Controller('reservations')
export class ReservationsController {
  @Get('availability')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PACIENTE, UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  findAvailability(): [] {
    return [];
  }
}
