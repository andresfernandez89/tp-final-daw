import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PORT = 3000;

function portFromBackendEnv() {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../backend/.env');
  if (!existsSync(envPath)) return null;
  const match = readFileSync(envPath, 'utf8').match(/^\s*PORT\s*=\s*["']?(\d+)["']?\s*$/m);
  return match ? Number(match[1]) : null;
}

const target =
  process.env.BACKEND_URL?.trim() ||
  `http://localhost:${portFromBackendEnv() ?? DEFAULT_PORT}`;

console.log(`[proxy] /api -> ${target}`);

export default {
  '/api/**': {
    target,
    secure: false,
  },
};
