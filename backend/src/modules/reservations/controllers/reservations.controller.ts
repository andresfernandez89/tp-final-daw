import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';

@ApiTags('Reservas')
@Controller('reservations')
export class ReservationsController {
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
}
