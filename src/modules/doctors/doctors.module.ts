import { Module } from '@nestjs/common';
import { DoctorsController } from './controllers/doctors.controller.js';
import { DoctorsService } from './services/doctors.service.js';

@Module({
  imports: [],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
