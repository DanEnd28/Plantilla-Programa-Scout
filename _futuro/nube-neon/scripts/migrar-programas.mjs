// Migra los programas guardados en el repo (programas/**/*.json) a la base de datos.
// Idempotente: usa el hash del contenido, así que correrlo dos veces no duplica nada.
//   - Contenido ya existente (mismo hash)          → se omite
//   - Programa nuevo (rama+fecha+título no existe) → se crea como v1
//   - Misma rama+fecha+título pero contenido distinto → se agrega como nueva versión
//
// Uso:  npm run db:migrar                 (migra)
//       npm run db:migrar -- --simular    (solo muestra qué haría, no escribe)
import './_env.mjs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { RAIZ } from './_env.mjs';
import { query, cerrarPool } from '../api/_lib/db.js';
import { hashContenido } from '../api/_lib/hash.js';
import { inferirMetadatos, crearPrograma, guardarVersion, ErrorApi } from '../api/_lib/programas.js';

const SIMULAR = process.argv.includes('--simular');
const AUTOR = 'Migración desde el repositorio';

async function buscarJson(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await buscarJson(p));
    else if (e.name.endsWith('.json')) out.push(p);
  }
  return out.sort();
}

const archivos = await buscarJson(path.join(RAIZ, 'programas'));
console.log(`📂 ${archivos.length} archivos JSON encontrados en programas/${SIMULAR ? '  (modo simulación)' : ''}\n`);
const resumen = { creados: 0, versiones: 0, omitidos: 0, errores: 0 };

try {
  for (const archivo of archivos) {
    const rel = path.relative(RAIZ, archivo);
    try {
      const contenido = JSON.parse(await readFile(archivo, 'utf8'));
      // Pistas por nombre de archivo (ej. programas/2026-09-19.json) por si al JSON le falta algo.
      const base = path.basename(archivo, '.json');
      const pista = { fecha: /^\d{4}-\d{2}-\d{2}$/.test(base) ? base : null };
      const meta = inferirMetadatos(contenido, pista);
      // Guardamos la rama explícita (el export viejo no la trae; se infiere de "unidad").
      if (!contenido._rama) contenido._rama = meta.rama;
      const hash = hashContenido(contenido);
      const metadata = { servidor: { recibido_en: new Date().toISOString() }, migracion: { archivo: rel } };
      const etiqueta = `${meta.rama.padEnd(9)} ${meta.fecha || 'sin-fecha '}  ${meta.titulo.slice(0, 60)}`;

      if (SIMULAR) {
        const ya = await query('SELECT 1 FROM programa_versiones WHERE content_hash=$1 LIMIT 1', [hash]).catch(() => ({ rows: [] }));
        console.log(`${ya.rows.length ? '⏭️  ya existe' : '➕ se subiría'}  ${etiqueta}  ← ${rel}`);
        continue;
      }

      const r = await crearPrograma({ contenido, autor: AUTOR, metadata, origen: 'migracion', pista })
        .catch(async e => {
          if (e instanceof ErrorApi && e.codigo === 'programa_existe' && e.extra.programa) {
            return guardarVersion(e.extra.programa.id, { contenido, autor: AUTOR, metadata, origen: 'migracion' });
          }
          throw e;
        });
      if (r.estado === 'creado') { resumen.creados++; console.log(`✅ creado      ${etiqueta}  ← ${rel}`); }
      else if (r.estado === 'nueva_version') { resumen.versiones++; console.log(`🆕 v${r.programa.version_actual} agregada ${etiqueta}  ← ${rel}`); }
      else { resumen.omitidos++; console.log(`⏭️  ya existía  ${etiqueta}  ← ${rel}`); }
    } catch (e) {
      resumen.errores++;
      console.error(`❌ ${rel}: ${e.message}`);
    }
  }
  if (!SIMULAR) console.log(`\nResumen: ${resumen.creados} creados, ${resumen.versiones} versiones nuevas, ${resumen.omitidos} omitidos, ${resumen.errores} errores.`);
  if (resumen.errores) process.exitCode = 1;
} finally {
  await cerrarPool();
}
