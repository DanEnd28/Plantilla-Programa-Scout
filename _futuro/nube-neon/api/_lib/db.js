// Conexión a Postgres con node-postgres (pg). Funciona igual con Neon,
// Supabase o un Postgres local: solo cambia DATABASE_URL.
import pg from 'pg';
import { attachDatabasePool } from '@vercel/functions';

let pool = null;

function urlConexion() {
  // Neon vía Vercel Marketplace crea DATABASE_URL (pooled) y POSTGRES_URL.
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

export function hayBaseDeDatos() {
  return Boolean(urlConexion());
}

export function getPool() {
  if (pool) return pool;
  const connectionString = urlConexion();
  if (!connectionString) {
    const e = new Error('La base de datos todavía no está configurada (falta DATABASE_URL).');
    e.status = 503; e.codigo = 'sin_base_de_datos';
    throw e;
  }
  const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(connectionString);
  const sslDesactivado = process.env.PGSSL === 'disable' || /sslmode=disable/.test(connectionString);
  pool = new pg.Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
    ssl: local || sslDesactivado ? false : (/sslmode=/.test(connectionString) ? undefined : { rejectUnauthorized: false }),
  });
  pool.on('error', err => console.error('[db] error en cliente inactivo:', err.message));
  // En Vercel (Fluid compute) cierra conexiones inactivas antes de suspender la función.
  try { attachDatabasePool(pool); } catch { /* fuera de Vercel no hace falta */ }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

// Ejecuta fn(client) dentro de una transacción.
export async function transaccion(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const r = await fn(client);
    await client.query('COMMIT');
    return r;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* ignorar */ }
    throw e;
  } finally {
    client.release();
  }
}

export async function cerrarPool() {
  if (pool) { await pool.end(); pool = null; }
}
