// Pruebas rápidas sin base de datos: hash canónico e inferencia de metadatos.
// Uso: npm run test:hash
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { RAIZ } from './_env.mjs';
import { hashContenido } from '../api/_lib/hash.js';
import { inferirMetadatos, slugificar } from '../api/_lib/programas.js';

// 1) El orden de las claves no cambia el hash; el contenido sí.
const a = { _data: { unidad: 'Manada', 'nombre-act': 'X' }, _ods: [1, 2] };
const b = { _ods: [1, 2], _data: { 'nombre-act': 'X', unidad: 'Manada' } };
assert.equal(hashContenido(a), hashContenido(b));
assert.notEqual(hashContenido(a), hashContenido({ ...a, _ods: [2, 1] }));
assert.notEqual(hashContenido(a), hashContenido({ ...a, _data: { ...a._data, 'nombre-act': 'Y' } }));
assert.equal(slugificar('DESAFÍO DE NUTRICIÓN — PROGRAMA 2'), 'desafio-de-nutricion-programa-2');
console.log('✅ hash canónico estable');

// 2) Todos los JSON del repo se interpretan bien.
async function buscar(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await buscar(p)); else if (e.name.endsWith('.json')) out.push(p);
  }
  return out.sort();
}
const hashes = new Set(); const slugs = new Set();
for (const f of await buscar(path.join(RAIZ, 'programas'))) {
  const c = JSON.parse(await readFile(f, 'utf8'));
  const m = inferirMetadatos(c);
  const h = hashContenido(c);
  assert.ok(m.rama && m.titulo && m.fecha, 'metadatos incompletos en ' + f);
  console.log(`  ${m.rama.padEnd(8)} ${m.fecha}  ${h.slice(0, 10)}  ${m.slug}`);
  assert.ok(!hashes.has(h), 'hash repetido ' + f); hashes.add(h);
  assert.ok(!slugs.has(m.slug), 'slug repetido ' + f); slugs.add(m.slug);
}
console.log(`✅ ${hashes.size} programas con hash y slug únicos`);
