import { join } from 'node:path';
import { DataSource } from 'typeorm';

/**
 * Carga `.env` si existe; si no, se usan las variables de entorno del proceso.
 */
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables de entorno del proceso.
}

/**
 * DataSource usado por el CLI de TypeORM (`npm run typeorm`) y por las seeds.
 *
 * Replica la configuración de `AppModule` pero sin las entidades: sólo necesita
 * las migraciones compiladas en `dist/database/migrations`. Por eso los
 * comandos `db:*` compilan antes de ejecutarse.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  logger: 'advanced-console',
  migrations: [join(import.meta.dirname, 'migrations', '*.js')],
});
