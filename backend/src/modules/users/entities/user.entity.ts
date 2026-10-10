import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { UserState } from '../../auth/enums/user-state.enum.js';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column({ type: 'text', name: 'documento', unique: true })
  documento: string;

  @Column({ type: 'text', name: 'apellidos' })
  apellidos: string;

  @Column({ type: 'text', name: 'nombres' })
  nombres: string;

  @Column({ type: 'text', name: 'email' })
  email: string;

  @Column({ type: 'text', name: 'clave' })
  clave: string;

  @Column({
    type: 'enum',
    enum: UserState,
    enumName: 'estados_usuarios',
    name: 'estado',
  })
  estado: UserState;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'roles_usuarios',
    name: 'rol',
  })
  rol: UserRole;
}
