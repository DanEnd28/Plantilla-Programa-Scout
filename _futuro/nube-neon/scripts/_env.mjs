// Carga .env.local (lo crea `vercel env pull`) o .env, si existen.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const f of ['.env.local', '.env']) {
  const p = path.join(RAIZ, f);
  if (existsSync(p)) { process.loadEnvFile(p); break; }
}
