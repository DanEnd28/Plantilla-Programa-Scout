// API de programas (Vercel Function, Node.js, sin framework).
//
// Rutas (vercel.json reescribe /api/programas/:id[...] hacia este archivo):
//   GET    /api/programas?rama=manada&q=texto   → lista (sin contenido) + conteo por rama
//          &archivados=1                        → solo archivados (ADMIN_KEY)
//   POST   /api/programas                       → crea un programa (versión 1)
//   GET    /api/programas/:id[?version=N]       → programa + contenido (última o versión N)
//   PUT    /api/programas/:id                   → guarda nueva versión (no duplica)
//   PATCH  /api/programas/:id  {archivado}      → archivar / desarchivar (ADMIN_KEY)
//   DELETE /api/programas/:id                   → borrar definitivo (ADMIN_KEY)
//   GET    /api/programas/:id/versiones         → historial de versiones
//   DELETE /api/programas/:id/versiones/:n      → borrar una versión (ADMIN_KEY)
import {
  json, manejarError, leerJson, exigirLectura, puedeLeer, permisoEscritura, exigirAdmin, esAdmin, veMetadataCompleta,
  metadataServidor, validarId,
} from './_lib/http.js';
import {
  RAMAS, ErrorApi, listarProgramas, contarArchivados, obtenerPrograma, listarVersiones, crearPrograma,
  guardarVersion, archivarPrograma, borrarPrograma, borrarVersion, limpiarAutor,
} from './_lib/programas.js';

function ruta(request) {
  const url = new URL(request.url);
  let id = url.searchParams.get('id');
  let vista = url.searchParams.get('vista');
  let numero = url.searchParams.get('n');
  // Respaldo por si la plataforma entrega la ruta original sin reescribir.
  const m = url.pathname.match(/\/api\/programas\/([^/]+)(?:\/(versiones)(?:\/(\d+))?)?\/?$/);
  if (m) { id = id || decodeURIComponent(m[1]); vista = vista || m[2] || null; numero = numero || m[3] || null; }
  return { url, id, vista, numero: numero == null ? null : Number(numero) };
}

// Quien guarda sin poder leer (sin clave, con READ_KEY configurada) solo recibe id/estado/versión:
// nada de títulos, autores ni datos de otros programas.
function respuestaEscritura(request, r) {
  if (puedeLeer(request)) return r;
  return {
    estado: r.estado,
    programa: { id: r.programa?.id, version_actual: r.programa?.version_actual ?? null },
    version: r.version ? { version: r.version.version, verificada: r.version.verificada } : null,
  };
}
function errorEscritura(request, e) {
  if (!(e instanceof ErrorApi) || puedeLeer(request)) return e;
  if (e.codigo === 'programa_existe') e.extra = { programa: { id: e.extra.programa?.id } };
  else if (e.codigo === 'conflicto_version') e.extra = { version_actual: e.extra.version_actual };
  else e.extra = {};
  if (e.codigo === 'programa_archivado') e.message = 'Ese programa está archivado. Pide a un administrador que lo desarchive.';
  return e;
}

function numeroValido(n) {
  if (!Number.isInteger(n) || n < 1) throw new ErrorApi(400, 'version_invalida', 'Versión inválida.');
  return n;
}

export async function GET(request) {
  try {
    exigirLectura(request);
    const admin = esAdmin(request);
    const { url, id, vista } = ruta(request);
    if (!id) {
      const rama = (url.searchParams.get('rama') || '').toLowerCase() || null;
      if (rama && !RAMAS.includes(rama)) throw new ErrorApi(400, 'rama_invalida', `Rama inválida. Usa: ${RAMAS.join(', ')}.`);
      const q = (url.searchParams.get('q') || '').trim().slice(0, 100) || null;
      const limite = Math.min(Math.max(Number(url.searchParams.get('limite')) || 100, 1), 500);
      const desde = Math.max(Number(url.searchParams.get('desde')) || 0, 0);
      const archivados = url.searchParams.get('archivados') === '1';
      if (archivados) exigirAdmin(request);
      const r = await listarProgramas({ rama, q, limite, desde, archivados });
      if (admin) r.total_archivados = await contarArchivados();
      return json({ ok: true, ...r });
    }
    validarId(id);
    if (vista === 'versiones') {
      const versiones = await listarVersiones(id, { completo: veMetadataCompleta(request), admin });
      return json({ ok: true, versiones });
    }
    const vParam = url.searchParams.get('version');
    const version = vParam ? numeroValido(Number(vParam)) : null;
    return json({ ok: true, ...(await obtenerPrograma(id, version, { admin })) });
  } catch (e) { return manejarError(e); }
}

export async function POST(request) {
  try {
    const { verificada } = permisoEscritura(request);
    const { id } = ruta(request);
    if (id) throw new ErrorApi(405, 'metodo_no_permitido', 'Para guardar cambios usa PUT /api/programas/:id.');
    const body = await leerJson(request);
    const r = await crearPrograma({
      contenido: body.contenido,
      autor: body.autor,
      metadata: metadataServidor(request, body.cliente),
      verificada,
    });
    return json({ ok: true, ...respuestaEscritura(request, r) }, r.estado === 'creado' ? 201 : 200);
  } catch (e) { return manejarError(errorEscritura(request, e)); }
}

export async function PUT(request) {
  try {
    const { verificada } = permisoEscritura(request);
    const { id } = ruta(request);
    validarId(id);
    const body = await leerJson(request);
    const r = await guardarVersion(id, {
      contenido: body.contenido,
      autor: body.autor,
      metadata: metadataServidor(request, body.cliente),
      versionBase: body.version_base ?? null,
      forzar: body.forzar === true,
      verificada,
    });
    return json({ ok: true, ...respuestaEscritura(request, r) }, r.estado === 'nueva_version' ? 201 : 200);
  } catch (e) { return manejarError(errorEscritura(request, e)); }
}

export async function PATCH(request) {
  try {
    exigirAdmin(request);
    const { id } = ruta(request);
    validarId(id);
    const body = await leerJson(request);
    if (typeof body.archivado !== 'boolean') throw new ErrorApi(400, 'dato_invalido', 'Envía { "archivado": true | false }.');
    const programa = await archivarPrograma(id, body.archivado, limpiarAutor(body.autor) || 'Administrador');
    return json({ ok: true, programa });
  } catch (e) { return manejarError(e); }
}

export async function DELETE(request) {
  try {
    exigirAdmin(request);
    const { id, vista, numero } = ruta(request);
    validarId(id);
    if (vista === 'versiones') {
      if (numero == null) throw new ErrorApi(400, 'version_invalida', 'Indica la versión: /api/programas/:id/versiones/:n');
      return json({ ok: true, ...(await borrarVersion(id, numeroValido(numero))) });
    }
    return json({ ok: true, borrado: await borrarPrograma(id) });
  } catch (e) { return manejarError(e); }
}
