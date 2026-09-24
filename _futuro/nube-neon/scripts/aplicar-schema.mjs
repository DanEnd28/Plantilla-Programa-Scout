// Aplica db/schema.sql a la base de datos de DATABASE_URL (idempotente).
// Uso: npm run db:schema
import './_env.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { RAIZ } from './_env.mjs';
import { query, cerrarPool } from '../api/_lib/db.js';

try {
  const sql = await readFile(path.join(RAIZ, 'db', 'schema.sql'), 'utf8');
  await query(sql);
  const { rows } = await query(`SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_name IN ('programas','programa_versiones') ORDER BY 1`);
  console.log('✅ Esquema aplicado. Tablas:', rows.map(r => r.table_name).join(', '));
} catch (e) {
  console.error('❌ No se pudo aplicar el esquema:', e.message);
  process.exitCode = 1;
} finally {
  await cerrarPool();
}
