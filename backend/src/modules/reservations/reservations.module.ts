import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ReservationsController } from './controllers/reservations.controller.js';
import { Reservation } from './entities/reservation.entity.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Reservation])],
  controllers: [ReservationsController],
  providers: [],
  exports: [],
})
export class ReservationsModule {}
