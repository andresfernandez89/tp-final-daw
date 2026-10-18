import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
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

  async findActiveById(id: number): Promise<Pick<Doctor, 'id'>> {
    const doctor = await this.doctorsRepository.findOne({
      select: { id: true },
      where: {
        id,
        usuario: { estado: UserState.ACTIVO, rol: UserRole.MEDICO },
      },
    });
    if (!doctor) {
      throw new NotFoundException('No se encontró un médico activo.');
    }
    return doctor;
  }

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

  async updateValorConsulta(id: number, valorConsulta: number): Promise<DoctorListItemDto> {
    try {
      const doctor = await this.doctorsRepository.findOne({
        where: { id },
        relations: { usuario: true },
      });

      if (!doctor) {
        throw new NotFoundException('No se encontró un médico activo.');
      }

      doctor.valor_consulta = valorConsulta;

      const item = plainToInstance(DoctorListItemDto, {
        id: doctor.id,
        nombres: doctor.usuario?.nombres ?? '',
        apellidos: doctor.usuario?.apellidos ?? '',
        matricula: doctor.matricula,
        valor_consulta: valorConsulta,
      });

      await validateOrReject(item);

      await this.doctorsRepository.save(doctor);

      return item;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'No se pudo actualizar el valor de consulta.',
      );
    }
  }
}
