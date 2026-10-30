import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Migración inicial: crea el esquema completo de la base de datos.
 *
 * Tablas:
 * - `usuarios`: documento (único), apellidos, nombres, email, clave (hash),
 *   estado (`estados_usuarios`: ACTIVO/BAJA) y rol (`roles_usuarios`:
 *   MEDICO/PACIENTE/ADMINISTRADOR).
 * - `medicos`: ficha profesional (matrícula, valor_consulta) vinculada 1:1 a
 *   un usuario.
 * - `reservas`: turno de un médico con un paciente en una fecha y hora, con
 *   estado (`estados_reservas`: ACTIVO/ATENDIDO/AUSENTE/CANCELADO) y el
 *   valor de consulta congelado.
 */
export class InitialSchema1790112080504 implements MigrationInterface {
  /** Nombre con el que TypeORM registra la migración en la tabla `migrations`. */
  name = 'InitialSchema1790112080504';

  /**
   * Crea los tipos enumerados y las tablas `usuarios`, `medicos` y `reservas`
   * con sus claves foráneas.
   *
   * @param queryRunner Ejecutor de consultas de la transacción de migración.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'usuarios',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'identity',
            generatedIdentity: 'ALWAYS',
          },
          { name: 'documento', type: 'text', isUnique: true },
          { name: 'apellidos', type: 'text' },
          { name: 'nombres', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'clave', type: 'text' },
          {
            name: 'estado',
            type: 'enum',
            enum: ['ACTIVO', 'BAJA'],
            enumName: 'estados_usuarios',
          },
          {
            name: 'rol',
            type: 'enum',
            enum: ['MEDICO', 'PACIENTE', 'ADMINISTRADOR'],
            enumName: 'roles_usuarios',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'medicos',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'identity',
            generatedIdentity: 'ALWAYS',
          },
          { name: 'id_usuario', type: 'integer' },
          { name: 'matricula', type: 'integer' },
          { name: 'valor_consulta', type: 'integer' },
        ],
        foreignKeys: [
          {
            name: 'fk_medicos_usuario',
            columnNames: ['id_usuario'],
            referencedTableName: 'usuarios',
            referencedColumnNames: ['id'],
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'reservas',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'identity',
            generatedIdentity: 'ALWAYS',
          },
          { name: 'id_medico', type: 'integer' },
          { name: 'id_paciente', type: 'integer' },
          { name: 'fecha_hora', type: 'timestamp' },
          {
            name: 'estado',
            type: 'enum',
            enum: ['ACTIVO', 'ATENDIDO', 'AUSENTE', 'CANCELADO'],
            enumName: 'estados_reservas',
          },
          { name: 'valor_consulta', type: 'integer' },
        ],
        foreignKeys: [
          {
            name: 'fk_reservas_medico',
            columnNames: ['id_medico'],
            referencedTableName: 'medicos',
            referencedColumnNames: ['id'],
          },
          {
            name: 'fk_reservas_paciente',
            columnNames: ['id_paciente'],
            referencedTableName: 'usuarios',
            referencedColumnNames: ['id'],
          },
        ],
      }),
    );
  }

  /**
   * Revierte la migración eliminando las tablas en orden inverso a sus
   * dependencias.
   *
   * @param queryRunner Ejecutor de consultas de la transacción de migración.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('reservas', 'estado');
    await queryRunner.dropTable('reservas');
    await queryRunner.dropTable('medicos');
    await queryRunner.dropColumns('usuarios', ['estado', 'rol']);
    await queryRunner.dropTable('usuarios');
  }
}
