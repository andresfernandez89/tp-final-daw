import { join } from 'node:path';
import { DataSource } from 'typeorm';

// DataSource usado por el CLI de TypeORM (migraciones).
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables de entorno del proceso.
}

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
