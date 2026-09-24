// Hash de contenido para detectar subidas duplicadas.
// Se calcula SIEMPRE en el servidor (y en el script de migración) sobre
// un JSON canónico: claves ordenadas, sin valores undefined. Así el mismo
// programa produce el mismo hash aunque el orden de las claves cambie.
import { createHash } from 'node:crypto';

export function canonicalizar(valor) {
  if (Array.isArray(valor)) return valor.map(v => (v === undefined ? null : canonicalizar(v)));
  if (valor && typeof valor === 'object') {
    const out = {};
    for (const k of Object.keys(valor).sort()) {
      if (valor[k] === undefined) continue;
      out[k] = canonicalizar(valor[k]);
    }
    return out;
  }
  return valor;
}

export function jsonCanonico(valor) {
  return JSON.stringify(canonicalizar(valor));
}

export function hashContenido(contenido) {
  return createHash('sha256').update(jsonCanonico(contenido), 'utf8').digest('hex');
}
