import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../auth/enums/user-role.enum.js';
import { UserState } from '../../auth/enums/user-state.enum.js';

/**
 * Usuario del sistema (tabla `usuarios`).
 *
 * Representa a pacientes, médicos y administradores; el rol los distingue.
 * Los médicos tienen además una ficha en {@link Doctor}. El documento es el
 * identificador de inicio de sesión y es único.
 */
@Entity('usuarios')
export class User {
  /** Identificador del usuario. Es el `sub` del JWT y el `patientId` de las reservas. */
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  /** Número de documento; único. Se usa para iniciar sesión y buscar pacientes. */
  @Column({ type: 'text', name: 'documento', unique: true })
  documento: string;

  /** Apellidos. */
  @Column({ type: 'text', name: 'apellidos' })
  apellidos: string;

  /** Nombres. */
  @Column({ type: 'text', name: 'nombres' })
  nombres: string;

  /** Correo electrónico. */
  @Column({ type: 'text', name: 'email' })
  email: string;

  /** Hash bcrypt de la contraseña. Nunca se expone en la API. */
  @Column({ type: 'text', name: 'clave' })
  clave: string;

  /** Estado del usuario (`ACTIVO` o `BAJA`). Sólo los activos pueden operar. */
  @Column({
    type: 'enum',
    enum: UserState,
    enumName: 'estados_usuarios',
    name: 'estado',
  })
  estado: UserState;

  /** Rol del usuario (`MEDICO`, `PACIENTE` o `ADMINISTRADOR`). */
  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'roles_usuarios',
    name: 'rol',
  })
  rol: UserRole;
}
