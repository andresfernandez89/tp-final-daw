import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doctor } from '../../doctors/entities/doctor.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { ReservationState } from '../enums/reservation-state.enum.js';

/**
 * Reserva de turno (tabla `reservas`).
 *
 * Vincula un médico ({@link Doctor}) con un paciente ({@link User}) en una
 * fecha y hora. `fecha_hora` se guarda como `timestamp` sin zona horaria con
 * la hora de pared de la clínica (Buenos Aires); la API la convierte al leer.
 */
@Entity('reservas')
export class Reservation {
  /** Identificador de la reserva. */
  @PrimaryGeneratedColumn('identity', {
    type: 'integer',
    name: 'id',
  })
  id: number;

  /** Clave foránea a `medicos.id`. */
  @Column({ type: 'integer', name: 'id_medico' })
  id_medico: number;

  /** Clave foránea a `usuarios.id` del paciente. */
  @Column({ type: 'integer', name: 'id_paciente' })
  id_paciente: number;

  /** Inicio del turno, hora de pared de la clínica (sin zona horaria). */
  @Column({ type: 'timestamp', name: 'fecha_hora' })
  fecha_hora: Date;

  /** Estado de la reserva. Ver {@link ReservationState}. */
  @Column({
    type: 'enum',
    enum: ReservationState,
    enumName: 'estados_reservas',
    name: 'estado',
  })
  estado: ReservationState;

  /** Valor de consulta congelado al momento de reservar, en pesos argentinos. */
  @Column({ type: 'integer', name: 'valor_consulta' })
  valor_consulta: number;

  /** Médico asignado. */
  @ManyToOne(() => Doctor, { nullable: false })
  @JoinColumn({ name: 'id_medico' })
  medico: Doctor;

  /** Paciente que reservó. */
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_paciente' })
  paciente: User;
}
