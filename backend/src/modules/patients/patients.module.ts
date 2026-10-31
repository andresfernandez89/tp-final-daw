import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { User } from '../users/entities/user.entity.js';
import { PatientsController } from './controllers/patients.controller.js';
import { PatientsService } from './services/patients.service.js';

/**
 * Módulo de pacientes.
 *
 * Permite a los administradores consultar los pacientes activos. Los
 * pacientes no tienen tabla propia: son usuarios con rol `PACIENTE`, por eso
 * el módulo trabaja sobre la entidad {@link User}.
 */
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
