import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { DoctorsController } from './controllers/doctors.controller.js';
import { Doctor } from './entities/doctor.entity.js';
import { DoctorsService } from './services/doctors.service.js';

/**
 * Módulo de médicos.
 *
 * Expone el listado de médicos activos y la modificación del valor de
 * consulta. Exporta {@link DoctorsService} para que el módulo de reservas
 * valide la existencia de médicos activos.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Doctor]), AuthModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
