/**
 * Descarga la especificación OpenAPI del servidor en ejecución y la guarda en
 * `docs/openapi.json`.
 *
 * Requiere el backend corriendo con `SWAGGER_HABILITADO=true`. La URL base se
 * toma de `API_URL` o, si no está definida, de `http://localhost:{PORT}` con
 * el `PORT` de `.env` (3000 por defecto).
 *
 * Uso: npm run docs:openapi
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PORT = 3000;
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function portFromEnvFile() {
  const envPath = resolve(backendRoot, '.env');
  if (!existsSync(envPath)) return null;
  const match = readFileSync(envPath, 'utf8').match(
    /^\s*PORT\s*=\s*["']?(\d+)["']?\s*$/m,
  );
  return match ? Number(match[1]) : null;
}

const baseUrl =
  process.env.API_URL?.trim().replace(/\/+$/, '') ||
  `http://localhost:${process.env.PORT ?? portFromEnvFile() ?? DEFAULT_PORT}`;
const specUrl = `${baseUrl}/api-json`;
const outputPath = resolve(backendRoot, 'docs', 'openapi.json');

let response;
try {
  response = await fetch(specUrl);
} catch (error) {
  console.error(
    `No se pudo conectar con ${specUrl}. ¿El backend está corriendo?`,
    error instanceof Error ? `(${error.message})` : '',
  );
  process.exit(1);
}

if (!response.ok) {
  console.error(
    `${specUrl} respondió ${response.status}. ` +
      'Verificar que SWAGGER_HABILITADO=true en backend/.env.',
  );
  process.exit(1);
}

const document = await response.json();
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);

const operations = Object.values(document.paths ?? {}).reduce(
  (total, methods) => total + Object.keys(methods).length,
  0,
);
console.log(
  `OpenAPI ${document.openapi} "${document.info?.title}" v${document.info?.version}: ` +
    `${operations} operaciones guardadas en ${outputPath}`,
);
