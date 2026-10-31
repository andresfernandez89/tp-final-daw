import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { AuthModule } from './modules/auth/auth.module.js';
import { DoctorsModule } from './modules/doctors/doctors.module.js';
import { PatientsModule } from './modules/patients/patients.module.js';
import { ReservationsModule } from './modules/reservations/reservations.module.js';
import { UsersModule } from './modules/users/users.module.js';

/**
 * Módulo raíz de la aplicación.
 *
 * Configura las variables de entorno (globales), la conexión a PostgreSQL con
 * TypeORM (sin `synchronize`; el esquema se gestiona con migraciones) y agrupa
 * los módulos funcionales: autenticación, usuarios, médicos, pacientes y
 * reservas.
 *
 * Variables de entorno utilizadas: `DB_HOST`, `DB_PORT`, `DB_USERNAME`,
 * `DB_PASSWORD`, `DB_NAME` y `DB_LOGGING`.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: false,
      autoLoadEntities: true,
      migrations: [join(import.meta.dirname, 'database', 'migrations', '*.js')],
      logging: process.env.DB_LOGGING === 'true',
      logger: 'advanced-console',
    }),
    AuthModule,
    UsersModule,
    DoctorsModule,
    PatientsModule,
    ReservationsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
