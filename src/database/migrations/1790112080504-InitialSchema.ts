import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialSchema1790112080504 implements MigrationInterface {
  name = 'InitialSchema1790112080504';

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('reservas', 'estado');
    await queryRunner.dropTable('reservas');
    await queryRunner.dropTable('medicos');
    await queryRunner.dropColumns('usuarios', ['estado', 'rol']);
    await queryRunner.dropTable('usuarios');
  }
}
