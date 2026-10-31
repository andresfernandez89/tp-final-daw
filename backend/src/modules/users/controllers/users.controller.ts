import { Controller } from '@nestjs/common';

/**
 * Controlador de usuarios (`/api/v1/users`).
 *
 * Aún no define rutas; reservado para la administración de usuarios
 * (alta, baja y modificación). Al no tener handlers, no aparece en Swagger.
 */
@Controller('users')
export class UsersController {}
