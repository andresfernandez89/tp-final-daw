import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { DoctorsModule } from '../doctors/doctors.module.js';
import { ReservationsController } from './controllers/reservations.controller.js';
import { Reservation } from './entities/reservation.entity.js';
import { ReservationsService } from './services/reservations.service.js';

/**
 * Módulo de reservas (turnos).
 *
 * Concentra la lógica de negocio principal del sistema: disponibilidad,
 * creación, cancelación, registro de atención y listados por rol. Importa
 * {@link DoctorsModule} para validar médicos activos y {@link AuthModule}
 * para los guards.
 */
@Module({
  imports: [AuthModule, DoctorsModule, TypeOrmModule.forFeature([Reservation])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
