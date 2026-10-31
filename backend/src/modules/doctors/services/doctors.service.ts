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

/**
 * Servicio de médicos.
 *
 * Un médico se considera "activo" cuando su usuario asociado tiene estado
 * `ACTIVO` y rol `MEDICO`.
 */
@Injectable()
export class DoctorsService {
  /**
   * Inyecta el repositorio de médicos.
   *
   * @param doctorsRepository Repositorio de la entidad {@link Doctor}.
   */
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorsRepository: Repository<Doctor>,
  ) {}

  /**
   * Busca un médico activo por id. Lo usa el módulo de reservas para validar
   * el médico antes de consultar disponibilidad.
   *
   * @param id Identificador del médico (`medicos.id`).
   * @returns Objeto con el id del médico.
   * @throws NotFoundException si no existe o su usuario no está activo con rol `MEDICO`.
   */
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

  /**
   * Lista los médicos activos ordenados por id ascendente.
   *
   * @returns Médicos con nombre, apellido, matrícula y valor de consulta.
   * @throws InternalServerErrorException si falla la consulta.
   */
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

  /**
   * Actualiza el valor de consulta de un médico.
   *
   * Construye y valida la respuesta antes de escribir, de modo que una
   * salida inválida no deje un cambio persistido. Las reservas existentes no
   * se modifican: conservan el valor copiado al crearlas.
   *
   * @param id Identificador del médico.
   * @param valorConsulta Nuevo valor de consulta (entero positivo).
   * @returns El médico con el valor actualizado.
   * @throws NotFoundException si el médico no existe.
   * @throws InternalServerErrorException si falla la validación o la escritura.
   */
  async updateValorConsulta(
    id: number,
    valorConsulta: number,
  ): Promise<DoctorListItemDto> {
    try {
      const doctor = await this.doctorsRepository.findOne({
        where: { id },
        relations: { usuario: true },
      });

      if (!doctor) {
        throw new NotFoundException('No se encontró un médico.');
      }

      const item = plainToInstance(DoctorListItemDto, {
        id: doctor.id,
        nombres: doctor.usuario?.nombres ?? '',
        apellidos: doctor.usuario?.apellidos ?? '',
        matricula: doctor.matricula,
        valor_consulta: valorConsulta,
      });

      await validateOrReject(item);

      const result = await this.doctorsRepository.update(
        { id },
        { valor_consulta: valorConsulta },
      );

      if (result.affected === 0) {
        throw new NotFoundException('No se encontró un médico.');
      }

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
