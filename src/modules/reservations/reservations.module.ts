import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ReservationsController } from './controllers/reservations.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [ReservationsController],
  providers: [],
  exports: [],
})
export class ReservationsModule {}
