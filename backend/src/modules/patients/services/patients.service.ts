import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import type { Repository } from 'typeorm';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { UserState } from '../../auth/enums/user-state.enum.js';
import { User } from '../../users/entities/user.entity.js';
import { PatientDto } from '../dtos/output/patient.dto.js';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findPatients(document?: string): Promise<PatientDto[]> {
    const users = await this.usersRepository.find({
      select: { id: true, documento: true, nombres: true, apellidos: true },
      where: {
        rol: UserRole.PACIENTE,
        estado: UserState.ACTIVO,
        ...(document !== undefined ? { documento: document.trim() } : {}),
      },
      order: { apellidos: 'ASC', nombres: 'ASC' },
    });

    return Promise.all(users.map((user) => this.toPatientAdapter(user)));
  }

  private async toPatientAdapter(user: User): Promise<PatientDto> {
    const patient = plainToInstance(PatientDto, {
      id: user.id,
      document: user.documento,
      firstName: user.nombres,
      lastName: user.apellidos,
    });
    await validateOrReject(patient);
    return patient;
  }
}
