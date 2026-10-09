import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { UserState } from '../../auth/enums/user-state.enum.js';
import { DoctorListItemDto } from '../dtos/output/doctor-list-item.dto.js';
import { Doctor } from '../entities/doctor.entity.js';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorsRepository: Repository<Doctor>,
  ) {}

  async findAll(): Promise<DoctorListItemDto[]> {
    try {
      const doctors = await this.doctorsRepository.find({
        select: {
          id: true,
          matricula: true,
          valor_consulta: true,
          usuario: { nombres: true, apellidos: true },
        },
        relations: { usuario: true },
        where: { usuario: { estado: UserState.ACTIVO, rol: UserRole.MEDICO } },
        order: { id: 'ASC' },
      });

      return doctors.map((doctor) => {
        const item = Object.assign(new DoctorListItemDto(), {
          id: doctor.id,
          nombres: doctor.usuario.nombres,
          apellidos: doctor.usuario.apellidos,
          matricula: doctor.matricula,
          valor_consulta: doctor.valor_consulta,
        });

        return item;
      });
    } catch {
      throw new InternalServerErrorException(
        'No se pudo obtener el listado de médicos.',
      );
    }
  }
}
