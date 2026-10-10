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

@Entity('reservas')
export class Reservation {
  @PrimaryGeneratedColumn('identity', {
    type: 'integer',
    name: 'id',
  })
  id: number;

  @Column({ type: 'integer', name: 'id_medico' })
  id_medico: number;

  @Column({ type: 'integer', name: 'id_paciente' })
  id_paciente: number;

  @Column({ type: 'timestamp', name: 'fecha_hora' })
  fecha_hora: Date;

  @Column({
    type: 'enum',
    enum: ReservationState,
    enumName: 'estados_reservas',
    name: 'estado',
  })
  estado: ReservationState;

  @Column({ type: 'integer', name: 'valor_consulta' })
  valor_consulta: number;

  @ManyToOne(() => Doctor, { nullable: false })
  @JoinColumn({ name: 'id_medico' })
  medico: Doctor;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_paciente' })
  paciente: User;
}
