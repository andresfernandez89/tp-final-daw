import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller.js';
import { UsersService } from './services/users.service.js';

/**
 * Módulo de usuarios.
 *
 * Define la entidad {@link User}, compartida por autenticación, pacientes y
 * médicos. Por ahora no expone endpoints propios: el controlador y el
 * servicio son marcadores de posición para la futura administración de
 * usuarios.
 */
@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
