import type { QueryRunner } from 'typeorm';
import dataSource from '../data-source.js';

/**
 * Seed rápida para probar la tabla del médico (marcar ATENDIDO / AUSENTE).
 * Inserta turnos de HOY alrededor de la hora actual (hora de la clínica).
 * No trunca nada: sólo borra los turnos de HOY de los médicos involucrados
 * y los vuelve a crear, así se puede correr las veces que haga falta.
 *
 * Uso: npm run db:seed:today
 */

const CLINIC_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const SEED_LOCK_NAME = 'tp-final-daw:today-reservations-seed';

type TodayReservation = {
  documentoMedico: string;
  documentoPaciente: string;
  /** Minutos respecto a la hora actual (negativo = ya empezó). */
  minutosDesdeAhora: number;
  estado: 'ACTIVO' | 'ATENDIDO' | 'AUSENTE' | 'CANCELADO';
  nota: string;
};

const MEDICO_1 = '20000001';
const MEDICO_2 = '20000002';

const seedToday: TodayReservation[] = [
  // --- Médico 1: casos a probar ---
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000001',
    minutosDesdeAhora: -180,
    estado: 'ACTIVO',
    nota: 'empezó hace 3h -> se puede marcar',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000002',
    minutosDesdeAhora: -120,
    estado: 'ACTIVO',
    nota: 'empezó hace 2h -> se puede marcar',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000003',
    minutosDesdeAhora: -60,
    estado: 'ACTIVO',
    nota: 'empezó hace 1h -> se puede marcar',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000004',
    minutosDesdeAhora: -30,
    estado: 'ACTIVO',
    nota: 'empezó hace 30 min -> se puede marcar',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000001',
    minutosDesdeAhora: 0,
    estado: 'ACTIVO',
    nota: 'empieza AHORA -> se puede marcar (límite inclusive)',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000002',
    minutosDesdeAhora: 15,
    estado: 'ACTIVO',
    nota: 'empieza en 15 min -> NO se puede marcar todavía',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000003',
    minutosDesdeAhora: 60,
    estado: 'ACTIVO',
    nota: 'empieza en 1h -> NO se puede marcar',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000004',
    minutosDesdeAhora: 120,
    estado: 'ACTIVO',
    nota: 'empieza en 2h -> NO se puede marcar',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000001',
    minutosDesdeAhora: -240,
    estado: 'ATENDIDO',
    nota: 'ya ATENDIDO -> se puede corregir a AUSENTE',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000002',
    minutosDesdeAhora: -300,
    estado: 'AUSENTE',
    nota: 'ya AUSENTE -> se puede corregir a ATENDIDO',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000003',
    minutosDesdeAhora: -210,
    estado: 'CANCELADO',
    nota: 'CANCELADO -> no se puede modificar',
  },
  {
    documentoMedico: MEDICO_1,
    documentoPaciente: '30000004',
    minutosDesdeAhora: 180,
    estado: 'CANCELADO',
    nota: 'CANCELADO futuro -> no se puede modificar',
  },

  // --- Médico 2: para probar que médico 1 no puede tocar turnos ajenos ---
  {
    documentoMedico: MEDICO_2,
    documentoPaciente: '30000001',
    minutosDesdeAhora: -90,
    estado: 'ACTIVO',
    nota: 'de otro médico, ya empezó',
  },
  {
    documentoMedico: MEDICO_2,
    documentoPaciente: '30000002',
    minutosDesdeAhora: 45,
    estado: 'ACTIVO',
    nota: 'de otro médico, futuro',
  },
];

async function runTodaySeed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('No se puede correr esta seed en prod.');
  }

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

    const doctors = [...new Set(seedToday.map((r) => r.documentoMedico))];

    const deleted = await queryRunner.query(
      `DELETE FROM reservas r
       USING medicos m
       INNER JOIN usuarios u ON u.id = m.id_usuario
       WHERE r.id_medico = m.id
         AND u.documento = ANY($1::text[])
         AND r.fecha_hora::date =
             (CURRENT_TIMESTAMP AT TIME ZONE $2)::date
       RETURNING r.id`,
      [doctors, CLINIC_TIME_ZONE],
    );

    for (const reservation of seedToday) {
      const inserted = await queryRunner.query(
        `INSERT INTO reservas
          (id_medico, id_paciente, fecha_hora, estado, valor_consulta)
         SELECT m.id, p.id,
                date_trunc('minute', CURRENT_TIMESTAMP AT TIME ZONE $5)
                  + ($3::integer * interval '1 minute'),
                $4::estados_reservas, m.valor_consulta
         FROM medicos m
         INNER JOIN usuarios u ON u.id = m.id_usuario
         INNER JOIN usuarios p ON p.documento = $2
         WHERE u.documento = $1 AND u.rol = 'MEDICO' AND u.estado = 'ACTIVO'
           AND p.rol = 'PACIENTE' AND p.estado = 'ACTIVO'
         RETURNING id, fecha_hora, estado`,
        [
          reservation.documentoMedico,
          reservation.documentoPaciente,
          reservation.minutosDesdeAhora,
          reservation.estado,
          CLINIC_TIME_ZONE,
        ],
      );

      if (inserted.length !== 1) {
        throw new Error(
          `No se pudo insertar el turno (${reservation.documentoMedico} / ${reservation.documentoPaciente}).`,
        );
      }

      const row = inserted[0] as {
        id: number;
        fecha_hora: Date;
        estado: string;
      };
      const hora = new Date(row.fecha_hora).toTimeString().slice(0, 5);
      console.log(
        `#${String(row.id).padStart(3)}  ${hora}  ${row.estado.padEnd(9)} med ${reservation.documentoMedico}  pac ${reservation.documentoPaciente}  — ${reservation.nota}`,
      );
    }

    await queryRunner.commitTransaction();
    console.log(
      `\nSeed de hoy completada: ${deleted.length} turnos de hoy borrados, ${seedToday.length} creados.`,
    );
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

runTodaySeed().catch((error: unknown) => {
  console.error('Falló la seed de turnos de hoy.', error);
  process.exitCode = 1;
});
