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
    rol: 'ADMINISTRADOR',
  },
  {
    documento: '10000002',
    apellidos: 'Administrador',
    nombres: 'Dos',
    email: 'admin2@example.com',
    rol: 'ADMINISTRADOR',
  },
  {
    documento: '10000003',
    apellidos: 'Administrador',
    nombres: 'Tres',
    email: 'admin3@example.com',
    rol: 'ADMINISTRADOR',
  },
  {
    documento: '20000001',
    apellidos: 'Medico',
    nombres: 'Uno',
    email: 'medico1@example.com',
    rol: 'MEDICO',
  },
  {
    documento: '20000002',
    apellidos: 'Medico',
    nombres: 'Dos',
    email: 'medico2@example.com',
    rol: 'MEDICO',
  },
  {
    documento: '20000003',
    apellidos: 'Medico',
    nombres: 'Tres',
    email: 'medico3@example.com',
    rol: 'MEDICO',
  },
  {
    documento: '30000001',
    apellidos: 'Paciente',
    nombres: 'Uno',
    email: 'paciente1@example.com',
    rol: 'PACIENTE',
  },
  {
    documento: '30000002',
    apellidos: 'Paciente',
    nombres: 'Dos',
    email: 'paciente2@example.com',
    rol: 'PACIENTE',
  },
  {
    documento: '30000003',
    apellidos: 'Paciente',
    nombres: 'Tres',
    email: 'paciente3@example.com',
    rol: 'PACIENTE',
  },
  {
    documento: '30000004',
    apellidos: 'Paciente',
    nombres: 'Cuatro',
    email: 'paciente4@example.com',
    rol: 'PACIENTE',
  },
] as const;

type SeedCounts = {
  total: number;
  administradores: number;
  medicos: number;
  pacientes: number;
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
          'ACTIVO',
          user.rol,
        ],
      );
    }

    const [counts] = await queryRunner.manager.query<SeedCounts[]>(
      `SELECT
         COUNT(*)::integer AS total,
         COUNT(*) FILTER (WHERE rol = 'ADMINISTRADOR')::integer AS administradores,
         COUNT(*) FILTER (WHERE rol = 'MEDICO')::integer AS medicos,
         COUNT(*) FILTER (WHERE rol = 'PACIENTE')::integer AS pacientes
       FROM usuarios`,
    );

    if (
      counts?.total !== 10 ||
      counts.administradores !== 3 ||
      counts.medicos !== 3 ||
      counts.pacientes !== 4
    ) {
      throw new Error('Hay una cantidad de users invalida en esta seed.');
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
