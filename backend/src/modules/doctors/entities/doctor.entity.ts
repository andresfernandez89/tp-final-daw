import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('medicos')
export class Doctor {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column({ type: 'integer', name: 'id_usuario' })
  id_usuario: number;

  @Column({ type: 'integer', name: 'matricula' })
  matricula: number;

  @Column({ type: 'integer', name: 'valor_consulta' })
  valor_consulta: number;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: User;
}
