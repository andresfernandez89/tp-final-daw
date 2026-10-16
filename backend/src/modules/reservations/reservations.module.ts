import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ReservationsController } from './controllers/reservations.controller.js';
import { Reservation } from './entities/reservation.entity.js';
import { ReservationsService } from './services/reservations.service.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Reservation])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
