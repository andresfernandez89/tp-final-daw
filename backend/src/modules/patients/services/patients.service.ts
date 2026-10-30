import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import type { Repository } from 'typeorm';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { UserState } from '../../auth/enums/user-state.enum.js';
import { User } from '../../users/entities/user.entity.js';
import { PatientDto } from '../dtos/output/patient.dto.js';

/**
 * Servicio de pacientes.
 *
 * Consulta la tabla `usuarios` filtrando por rol `PACIENTE` y estado `ACTIVO`.
 */
@Injectable()
export class PatientsService {
  /**
   * Inyecta el repositorio de usuarios.
   *
   * @param usersRepository Repositorio de la entidad {@link User}; los pacientes son usuarios con rol `PACIENTE`.
   */
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Lista los pacientes activos, opcionalmente por documento exacto.
   *
   * @param document Documento a buscar (se recortan los espacios). Si es `undefined`, no se filtra.
   * @returns Pacientes ordenados por apellido y nombre; vacío si no hay coincidencias.
   */
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

  /**
   * Convierte un usuario en {@link PatientDto} y valida el resultado.
   *
   * @param user Usuario con rol `PACIENTE`.
   * @returns DTO validado del paciente.
   */
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
