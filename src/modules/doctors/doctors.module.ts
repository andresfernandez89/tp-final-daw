import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { DoctorsController } from './controllers/doctors.controller.js';
import { Doctor } from './entities/doctor.entity.js';
import { DoctorsService } from './services/doctors.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor]), AuthModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
