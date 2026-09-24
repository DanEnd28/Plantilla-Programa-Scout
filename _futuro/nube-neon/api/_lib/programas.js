// Lógica de dominio: inferir metadatos de un programa, validar, crear,
// guardar versiones (sin duplicar) y consultar. La usan la API y el
// script de migración para que ambos se comporten exactamente igual.
import { hashContenido } from './hash.js';
import { query, transaccion } from './db.js';

export const RAMAS = ['manada', 'tropa', 'comunidad', 'clan', 'grupal'];

export class ErrorApi extends Error {
  constructor(status, codigo, mensaje, extra = {}) {
    super(mensaje);
    this.status = status; this.codigo = codigo; this.extra = extra;
  }
}

// ── Utilidades de texto ─────────────────────────────────────────
export function textoPlano(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugificar(t) {
  return textoPlano(t)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'sin-titulo';
}

function isoValida(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) ? null : s;
}

// "19/09/2026" → "2026-09-19"
function ddmmyyyyAIso(s) {
  const m = String(s ?? '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return isoValida(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
}

export function normalizarRama(valor) {
  const t = slugificar(valor || '');
  if (!t || t === 'sin-titulo') return null;
  if (RAMAS.includes(t)) return t;
  for (const r of RAMAS) if (t.includes(r)) return r;
  if (t.includes('lobat')) return 'manada';
  if (t.includes('scout') && !t.includes('rover')) return 'tropa';
  if (t.includes('rover')) return 'clan';
  if (t.includes('caminante') || t.includes('pionero')) return 'comunidad';
  return null;
}

// Extrae rama, título y fechas del contenido (formato "Exportar datos").
export function inferirMetadatos(contenido, pista = {}) {
  const d = contenido?._data || {};
  const rama = normalizarRama(contenido?._rama) || normalizarRama(d.unidad)
    || normalizarRama(pista.rama) || 'manada';
  const titulo = textoPlano(d['nombre-act']) || textoPlano(contenido?._doc_title) || pista.titulo || 'Programa sin título';
  const fecha = isoValida(contenido?._fechaIni) || ddmmyyyyAIso(d.fecha) || isoValida(pista.fecha) || null;
  const fechaFin = isoValida(contenido?._fechaFin) || fecha;
  const slug = [rama, fecha || 'sin-fecha', slugificar(titulo)].join('-');
  return { rama, titulo: titulo.slice(0, 300), fecha, fechaFin, slug };
}

// ── Validación ──────────────────────────────────────────────────
export function validarContenido(contenido) {
  if (!contenido || typeof contenido !== 'object' || Array.isArray(contenido)) {
    throw new ErrorApi(400, 'contenido_invalido', 'El campo "contenido" debe ser un objeto JSON.');
  }
  if (!contenido._data || typeof contenido._data !== 'object') {
    throw new ErrorApi(400, 'contenido_invalido', 'El contenido no tiene "_data" (¿es un JSON de "Exportar datos"?).');
  }
  for (const k of ['_prog', '_ind', '_ods', '_extra_pages']) {
    if (contenido[k] !== undefined && !Array.isArray(contenido[k])) {
      throw new ErrorApi(400, 'contenido_invalido', `"${k}" debe ser una lista.`);
    }
  }
  const titulo = textoPlano(contenido._data['nombre-act']);
  if (!titulo) {
    throw new ErrorApi(400, 'sin_titulo', 'Ponle un nombre a la actividad antes de guardarla en la nube.');
  }
}

export function limpiarAutor(a) {
  const t = textoPlano(a).slice(0, 80);
  return t || null;
}

// ── Consultas ───────────────────────────────────────────────────
const COLS_PROGRAMA = `p.id, p.slug, p.rama, p.titulo, to_char(p.fecha,'YYYY-MM-DD') AS fecha,
  to_char(p.fecha_fin,'YYYY-MM-DD') AS fecha_fin, p.version_actual, p.created_at, p.updated_at,
  p.creado_por, p.current_version_id, p.archivado_at, p.archivado_por`;

// archivados=false → solo activos (lo normal); true → solo archivados (vista de admin).
export async function listarProgramas({ rama, q, limite = 100, desde = 0, archivados = false } = {}) {
  const cond = [archivados ? 'p.archivado_at IS NOT NULL' : 'p.archivado_at IS NULL']; const params = [];
  if (rama) { params.push(rama); cond.push(`p.rama = $${params.length}`); }
  if (q) { params.push(`%${q}%`); cond.push(`(p.titulo ILIKE $${params.length} OR p.slug ILIKE $${params.length})`); }
  params.push(limite, desde);
  const { rows } = await query(
    `SELECT ${COLS_PROGRAMA}, v.autor AS ultimo_autor, v.created_at AS ultima_version_at, v.verificada AS ultima_verificada
       FROM programas p
       LEFT JOIN programa_versiones v ON v.id = p.current_version_id
      WHERE ${cond.join(' AND ')}
      ORDER BY p.fecha DESC NULLS LAST, p.updated_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  const conteo = await query(
    `SELECT rama, count(*)::int AS total FROM programas
      WHERE ${archivados ? 'archivado_at IS NOT NULL' : 'archivado_at IS NULL'} GROUP BY rama`);
  return { programas: rows, conteo: Object.fromEntries(conteo.rows.map(r => [r.rama, r.total])) };
}

export async function contarArchivados() {
  const { rows } = await query(`SELECT count(*)::int AS n FROM programas WHERE archivado_at IS NOT NULL`);
  return rows[0].n;
}

async function programaActivo(id, { admin = false } = {}) {
  const { rows } = await query(`SELECT ${COLS_PROGRAMA} FROM programas p WHERE p.id = $1`, [id]);
  if (!rows.length) throw new ErrorApi(404, 'no_encontrado', 'Programa no encontrado.');
  if (rows[0].archivado_at && !admin) throw new ErrorApi(404, 'archivado', 'Este programa fue archivado por un administrador.');
  return rows[0];
}

export async function obtenerPrograma(id, version = null, { admin = false } = {}) {
  const programa = await programaActivo(id, { admin });
  const cols = 'id, version, contenido, content_hash, autor, verificada, created_at';
  const v = version
    ? await query(`SELECT ${cols} FROM programa_versiones WHERE programa_id=$1 AND version=$2`, [id, version])
    : await query(`SELECT ${cols} FROM programa_versiones WHERE id=$1`, [programa.current_version_id]);
  if (!v.rows.length) throw new ErrorApi(404, 'version_no_encontrada', 'Esa versión no existe.');
  return { programa, version: { ...v.rows[0], content_hash: v.rows[0].content_hash.trim() } };
}

// Metadata pública: país/ciudad y plataforma (sin IP ni user-agent completo).
function metadataPublica(m = {}) {
  return {
    pais: m.servidor?.pais || null,
    ciudad: m.servidor?.ciudad || null,
    plataforma: m.cliente?.plataforma || null,
    zona_horaria: m.cliente?.zona_horaria || null,
  };
}

export async function listarVersiones(id, { completo = false, admin = false } = {}) {
  await programaActivo(id, { admin });
  const { rows } = await query(
    `SELECT id, version, content_hash, autor, verificada, metadata, origen, created_at
       FROM programa_versiones WHERE programa_id=$1 ORDER BY version DESC`, [id]);
  return rows.map(r => ({
    ...r,
    content_hash: r.content_hash.trim(),
    metadata: completo ? r.metadata : metadataPublica(r.metadata),
  }));
}

// ── Escritura ───────────────────────────────────────────────────
async function insertarVersion(client, programaId, numero, contenido, hash, autor, metadata, origen, verificada) {
  const { rows } = await client.query(
    `INSERT INTO programa_versiones (programa_id, version, contenido, content_hash, autor, metadata, origen, verificada)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, version, autor, verificada, created_at`,
    [programaId, numero, contenido, hash, autor, metadata, origen, verificada]);
  return rows[0];
}

function errorArchivado(p) {
  return new ErrorApi(409, 'programa_archivado',
    `«${p.titulo}» existe pero está archivado. Pide a un administrador que lo desarchive.`,
    { programa: { id: p.id, titulo: p.titulo, rama: p.rama } });
}

// Crea un programa nuevo. Reglas "subir una sola vez":
//  - Si exactamente ese contenido ya existe (en cualquier programa) → no crea nada, devuelve el existente.
//  - Si ya hay un programa con la misma rama+fecha+título → 409, se debe guardar como versión de ese.
export async function crearPrograma({ contenido, autor, metadata = {}, origen = 'web', pista = {}, verificada = true }) {
  validarContenido(contenido);
  const hash = hashContenido(contenido);
  const meta = inferirMetadatos(contenido, pista);
  autor = limpiarAutor(autor);

  const dup = await query(
    `SELECT p.id, p.titulo, p.rama, p.version_actual, p.archivado_at, v.version FROM programa_versiones v
       JOIN programas p ON p.id=v.programa_id
      WHERE v.content_hash=$1 ORDER BY p.archivado_at NULLS FIRST, v.created_at LIMIT 1`, [hash]);
  if (dup.rows.length) {
    const d = dup.rows[0];
    if (d.archivado_at) throw errorArchivado(d);
    return { estado: 'duplicado', programa: { id: d.id, titulo: d.titulo, rama: d.rama, version_actual: d.version_actual }, version: { version: d.version }, hash };
  }
  const mismoSlug = await query(`SELECT id, titulo, rama, version_actual, archivado_at FROM programas WHERE slug=$1`, [meta.slug]);
  if (mismoSlug.rows.length) {
    const m = mismoSlug.rows[0];
    if (m.archivado_at) throw errorArchivado(m);
    throw new ErrorApi(409, 'programa_existe',
      'Ya existe un programa con la misma rama, fecha y nombre. Guárdalo como nueva versión de ese programa.',
      { programa: { id: m.id, titulo: m.titulo, rama: m.rama, version_actual: m.version_actual } });
  }

  try {
    return await transaccion(async client => {
      const p = await client.query(
        `INSERT INTO programas (slug, rama, titulo, fecha, fecha_fin, version_actual, creado_por)
         VALUES ($1,$2,$3,$4,$5,1,$6) RETURNING id`,
        [meta.slug, meta.rama, meta.titulo, meta.fecha, meta.fechaFin, autor]);
      const id = p.rows[0].id;
      const v = await insertarVersion(client, id, 1, contenido, hash, autor, metadata, origen, verificada);
      await client.query(`UPDATE programas SET current_version_id=$1 WHERE id=$2`, [v.id, id]);
      return { estado: 'creado', programa: { id, ...meta, version_actual: 1 }, version: v, hash };
    });
  } catch (e) {
    if (e.code === '23505') { // carrera: otro usuario lo creó al mismo tiempo
      throw new ErrorApi(409, 'programa_existe', 'Otro usuario acaba de crear este programa. Recarga e inténtalo como versión.');
    }
    throw e;
  }
}

// Guarda una nueva versión de un programa existente (nunca duplica).
//  - Si el contenido es idéntico a alguna versión previa → 'sin_cambios'.
//  - Si versionBase no es la actual (alguien guardó después) → 409 salvo forzar=true.
export async function guardarVersion(id, { contenido, autor, metadata = {}, origen = 'web', versionBase = null, forzar = false, verificada = true }) {
  validarContenido(contenido);
  const hash = hashContenido(contenido);
  const meta = inferirMetadatos(contenido);
  autor = limpiarAutor(autor);

  try {
    return await transaccion(async client => {
      const p = await client.query(`SELECT id, titulo, rama, version_actual, slug, archivado_at FROM programas WHERE id=$1 FOR UPDATE`, [id]);
      if (!p.rows.length) throw new ErrorApi(404, 'no_encontrado', 'Programa no encontrado.');
      if (p.rows[0].archivado_at) throw errorArchivado(p.rows[0]);
      const actual = p.rows[0].version_actual;

      const igual = await client.query(
        `SELECT version, autor, created_at FROM programa_versiones WHERE programa_id=$1 AND content_hash=$2`, [id, hash]);
      if (igual.rows.length) {
        return { estado: 'sin_cambios', programa: { id, titulo: p.rows[0].titulo, version_actual: actual }, version: igual.rows[0], hash };
      }
      if (versionBase != null && Number(versionBase) !== actual && !forzar) {
        const ult = await client.query(
          `SELECT version, autor, created_at FROM programa_versiones WHERE programa_id=$1 AND version=$2`, [id, actual]);
        throw new ErrorApi(409, 'conflicto_version',
          `Hay una versión más reciente (v${actual}) que la que estabas editando (v${versionBase}).`,
          { version_actual: actual, ultima: ult.rows[0] || null });
      }
      const numero = actual + 1;
      const v = await insertarVersion(client, id, numero, contenido, hash, autor, metadata, origen, verificada);
      await client.query(
        `UPDATE programas SET current_version_id=$1, version_actual=$2, rama=$3, titulo=$4,
                fecha=$5, fecha_fin=$6, updated_at=now() WHERE id=$7`,
        [v.id, numero, meta.rama, meta.titulo, meta.fecha, meta.fechaFin, id]);
      return { estado: 'nueva_version', programa: { id, ...meta, slug: p.rows[0].slug, version_actual: numero }, version: v, hash };
    });
  } catch (e) {
    if (e.code === '23505') throw new ErrorApi(409, 'conflicto_version', 'Otro guardado entró al mismo tiempo. Inténtalo de nuevo.');
    throw e;
  }
}

// ── Administración (solo ADMIN_KEY) ─────────────────────────────
export async function archivarPrograma(id, archivar, quien = null) {
  const { rows } = await query(
    `UPDATE programas SET archivado_at = CASE WHEN $2 THEN COALESCE(archivado_at, now()) ELSE NULL END,
            archivado_por = CASE WHEN $2 THEN $3 ELSE NULL END
      WHERE id=$1 RETURNING id, titulo, rama, archivado_at`, [id, Boolean(archivar), limpiarAutor(quien)]);
  if (!rows.length) throw new ErrorApi(404, 'no_encontrado', 'Programa no encontrado.');
  return rows[0];
}

export async function borrarPrograma(id) {
  const { rows } = await query(
    `DELETE FROM programas WHERE id=$1
     RETURNING id, titulo, (SELECT count(*)::int FROM programa_versiones WHERE programa_id=$1) AS versiones`, [id]);
  if (!rows.length) throw new ErrorApi(404, 'no_encontrado', 'Programa no encontrado.');
  return rows[0];
}

// Borra una versión. No se puede borrar la única (para eso se borra el programa).
// Si era la actual, la actual pasa a ser la más reciente que quede.
export async function borrarVersion(id, numero) {
  return transaccion(async client => {
    const p = await client.query(`SELECT id, version_actual FROM programas WHERE id=$1 FOR UPDATE`, [id]);
    if (!p.rows.length) throw new ErrorApi(404, 'no_encontrado', 'Programa no encontrado.');
    const total = await client.query(`SELECT count(*)::int AS n FROM programa_versiones WHERE programa_id=$1`, [id]);
    const del = await client.query(`DELETE FROM programa_versiones WHERE programa_id=$1 AND version=$2 RETURNING id`, [id, numero]);
    if (!del.rows.length) throw new ErrorApi(404, 'version_no_encontrada', 'Esa versión no existe.');
    if (total.rows[0].n <= 1) throw new ErrorApi(409, 'ultima_version', 'Es la única versión: para quitarla borra el programa completo.');
    const ult = await client.query(
      `SELECT id, version, contenido FROM programa_versiones WHERE programa_id=$1 ORDER BY version DESC LIMIT 1`, [id]);
    const u = ult.rows[0];
    const meta = inferirMetadatos(u.contenido);
    await client.query(
      `UPDATE programas SET current_version_id=$1, version_actual=$2, rama=$3, titulo=$4, fecha=$5, fecha_fin=$6, updated_at=now()
        WHERE id=$7`, [u.id, u.version, meta.rama, meta.titulo, meta.fecha, meta.fechaFin, id]);
    return { borrada: numero, version_actual: u.version };
  });
}
