import { Module } from '@nestjs/common';
import { PatientsController } from './controllers/patients.controller.js';
import { PatientsService } from './services/patients.service.js';

@Module({
  imports: [],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
