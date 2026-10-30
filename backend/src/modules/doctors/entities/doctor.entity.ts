import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

/**
 * Ficha profesional de un médico (tabla `medicos`).
 *
 * Cada médico es un {@link User} con rol `MEDICO` más estos datos
 * profesionales. Las reservas referencian `medicos.id`, no el id de usuario.
 */
@Entity('medicos')
export class Doctor {
  /** Identificador de la ficha del médico. */
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  /** Clave foránea al usuario (`usuarios.id`) con rol `MEDICO`. */
  @Column({ type: 'integer', name: 'id_usuario' })
  id_usuario: number;

  /** Número de matrícula profesional. */
  @Column({ type: 'integer', name: 'matricula' })
  matricula: number;

  /** Valor de consulta vigente, en pesos argentinos. Se copia en cada reserva nueva. */
  @Column({ type: 'integer', name: 'valor_consulta' })
  valor_consulta: number;

  /** Usuario asociado; aporta nombre, documento, email y estado. */
  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: User;
}
