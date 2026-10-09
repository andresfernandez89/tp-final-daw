import bcrypt from 'bcrypt';
import type { QueryRunner } from 'typeorm';
import dataSource from '../data-source.js';

const BCRYPT_ROUNDS = 12;
const SEED_LOCK_NAME = 'tp-final-daw:initial-seed';

const seedUsers = [
  {
    documento: '10000001',
    apellidos: 'Administrador',
    nombres: 'Uno',
    email: 'admin1@example.com',
    estado: 'ACTIVO',
    rol: 'ADMINISTRADOR',
  },
  {
    documento: '10000002',
    apellidos: 'Administrador',
    nombres: 'Dos',
    email: 'admin2@example.com',
    estado: 'ACTIVO',
    rol: 'ADMINISTRADOR',
  },
  {
    documento: '10000003',
    apellidos: 'Administrador',
    nombres: 'Tres',
    email: 'admin3@example.com',
    estado: 'ACTIVO',
    rol: 'ADMINISTRADOR',
  },
  {
    documento: '10000004',
    apellidos: 'Administrador',
    nombres: 'Baja',
    email: 'admin.baja@example.com',
    estado: 'BAJA',
    rol: 'ADMINISTRADOR',
  },
  {
    documento: '20000001',
    apellidos: 'Medico',
    nombres: 'Uno',
    email: 'medico1@example.com',
    estado: 'ACTIVO',
    rol: 'MEDICO',
  },
  {
    documento: '20000002',
    apellidos: 'Medico',
    nombres: 'Dos',
    email: 'medico2@example.com',
    estado: 'ACTIVO',
    rol: 'MEDICO',
  },
  {
    documento: '20000003',
    apellidos: 'Medico',
    nombres: 'Tres',
    email: 'medico3@example.com',
    estado: 'ACTIVO',
    rol: 'MEDICO',
  },
  {
    documento: '20000004',
    apellidos: 'Medico',
    nombres: 'Baja',
    email: 'medico.baja@example.com',
    estado: 'BAJA',
    rol: 'MEDICO',
  },
  {
    documento: '30000001',
    apellidos: 'Paciente',
    nombres: 'Uno',
    email: 'paciente1@example.com',
    estado: 'ACTIVO',
    rol: 'PACIENTE',
  },
  {
    documento: '30000002',
    apellidos: 'Paciente',
    nombres: 'Dos',
    email: 'paciente2@example.com',
    estado: 'ACTIVO',
    rol: 'PACIENTE',
  },
  {
    documento: '30000003',
    apellidos: 'Paciente',
    nombres: 'Tres',
    email: 'paciente3@example.com',
    estado: 'ACTIVO',
    rol: 'PACIENTE',
  },
  {
    documento: '30000004',
    apellidos: 'Paciente',
    nombres: 'Cuatro',
    email: 'paciente4@example.com',
    estado: 'ACTIVO',
    rol: 'PACIENTE',
  },
  {
    documento: '30000005',
    apellidos: 'Paciente',
    nombres: 'Baja',
    email: 'paciente.baja@example.com',
    estado: 'BAJA',
    rol: 'PACIENTE',
  },
] as const;

const seedDoctors = [
  {
    documento: '20000001',
    matricula: 10001,
    valorConsulta: 15000,
  },
  {
    documento: '20000002',
    matricula: 10002,
    valorConsulta: 18000,
  },
  {
    documento: '20000003',
    matricula: 10003,
    valorConsulta: 20000,
  },
  {
    documento: '20000004',
    matricula: 10004,
    valorConsulta: 15000,
  },
] as const;

type SeedCounts = {
  total: number;
  administradores: number;
  medicos: number;
  pacientes: number;
  bajas: number;
  administradores_baja: number;
  medicos_baja: number;
  pacientes_baja: number;
  registros_medicos: number;
  medicos_vinculados: number;
};

async function runInitialSeed(): Promise<void> {
  const password = process.env.SEED_DEFAULT_PASSWORD?.trim();

  if (!password) {
    throw new Error('SEED_DEFAULT_PASSWORD debe ser vaildo.');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('No se puede correr la seed inicial en prod.');
  }

  const usersWithHashes = await Promise.all(
    seedUsers.map(async (user) => ({
      ...user,
      clave: await bcrypt.hash(password, BCRYPT_ROUNDS),
    })),
  );

  let queryRunner: QueryRunner | undefined;

  try {
    await dataSource.initialize();
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    await queryRunner.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [SEED_LOCK_NAME],
    );
    await queryRunner.query(
      'TRUNCATE TABLE reservas, medicos, usuarios RESTART IDENTITY',
    );

    for (const user of usersWithHashes) {
      await queryRunner.query(
        `INSERT INTO usuarios
          (documento, apellidos, nombres, email, clave, estado, rol)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user.documento,
          user.apellidos,
          user.nombres,
          user.email,
          user.clave,
          user.estado,
          user.rol,
        ],
      );
    }

    for (const doctor of seedDoctors) {
      await queryRunner.query(
        `INSERT INTO medicos (id_usuario, matricula, valor_consulta)
         SELECT id, $2, $3
         FROM usuarios
         WHERE documento = $1 AND rol = 'MEDICO'`,
        [doctor.documento, doctor.matricula, doctor.valorConsulta],
      );
    }

    const [counts] = await queryRunner.manager.query<SeedCounts[]>(
      `SELECT
         COUNT(*)::integer AS total,
         COUNT(*) FILTER (WHERE rol = 'ADMINISTRADOR')::integer AS administradores,
         COUNT(*) FILTER (WHERE rol = 'MEDICO')::integer AS medicos,
         COUNT(*) FILTER (WHERE rol = 'PACIENTE')::integer AS pacientes,
         COUNT(*) FILTER (WHERE estado = 'BAJA')::integer AS bajas,
         COUNT(*) FILTER (WHERE rol = 'ADMINISTRADOR' AND estado = 'BAJA')::integer AS administradores_baja,
         COUNT(*) FILTER (WHERE rol = 'MEDICO' AND estado = 'BAJA')::integer AS medicos_baja,
         COUNT(*) FILTER (WHERE rol = 'PACIENTE' AND estado = 'BAJA')::integer AS pacientes_baja,
         (SELECT COUNT(*)::integer FROM medicos) AS registros_medicos,
         (SELECT COUNT(DISTINCT m.id_usuario)::integer
          FROM medicos m
          INNER JOIN usuarios u ON u.id = m.id_usuario
          WHERE u.rol = 'MEDICO') AS medicos_vinculados
       FROM usuarios`,
    );

    if (
      counts?.total !== 13 ||
      counts.administradores !== 4 ||
      counts.medicos !== 4 ||
      counts.pacientes !== 5 ||
      counts.bajas !== 3 ||
      counts.administradores_baja !== 1 ||
      counts.medicos_baja !== 1 ||
      counts.pacientes_baja !== 1 ||
      counts.registros_medicos !== 4 ||
      counts.medicos_vinculados !== 4
    ) {
      throw new Error('Hay una cantidad de registros invalida en esta seed.');
    }

    await queryRunner.commitTransaction();
    console.log('Seed completada con exito.');
  } catch (error) {
    if (queryRunner?.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }

    throw error;
  } finally {
    await queryRunner?.release();

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runInitialSeed().catch((error: unknown) => {
  console.error('Fallo la seed inicial.', error);
  process.exitCode = 1;
});
