import { Module } from '@nestjs/common';
import { ReservationsController } from './controllers/reservations.controller.js';
import { ReservationsService } from './services/reservations.service.js';

@Module({
  imports: [],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
