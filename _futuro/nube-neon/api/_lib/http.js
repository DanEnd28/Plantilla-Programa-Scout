// Utilidades HTTP para las Vercel Functions (API Web estándar: Request/Response).
import { timingSafeEqual } from 'node:crypto';
import { geolocation, ipAddress } from '@vercel/functions';
import { ErrorApi } from './programas.js';

export const MAX_BYTES = Number(process.env.MAX_BODY_BYTES || 3_500_000); // Vercel acepta hasta 4,5 MB

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function manejarError(e) {
  if (e instanceof ErrorApi) return json({ ok: false, error: e.codigo, mensaje: e.message, ...e.extra }, e.status);
  if (e?.codigo === 'sin_base_de_datos') return json({ ok: false, error: e.codigo, mensaje: e.message }, 503);
  console.error('[api] error inesperado:', e);
  return json({ ok: false, error: 'error_interno', mensaje: 'Error interno del servidor.' }, 500);
}

export async function leerJson(request) {
  const largo = Number(request.headers.get('content-length') || 0);
  if (largo > MAX_BYTES) throw new ErrorApi(413, 'muy_grande', `El programa pesa demasiado (máx. ${Math.round(MAX_BYTES / 1e6 * 10) / 10} MB). ¿Tiene logos muy pesados?`);
  const texto = await request.text();
  if (Buffer.byteLength(texto, 'utf8') > MAX_BYTES) throw new ErrorApi(413, 'muy_grande', 'El programa pesa demasiado.');
  try { return JSON.parse(texto || '{}'); }
  catch { throw new ErrorApi(400, 'json_invalido', 'El cuerpo de la petición no es JSON válido.'); }
}

// ── Claves de acceso (opcionales, por variable de entorno) ──────
//   READ_KEY   → si existe, hace falta para ver/listar (EDIT_KEY y ADMIN_KEY también sirven).
//   EDIT_KEY   → guardar con esta clave deja la versión "verificada".
//                Guardar SIN clave también se permite: la versión queda "sin verificar".
//   ADMIN_KEY  → superusuario: archivar/desarchivar y borrar programas o versiones (también lee y guarda verificado).
function igualSeguro(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
function claveEnviada(request) {
  return (request.headers.get('x-clave-grupo')
    || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    || '').trim();
}
const env = k => (process.env[k] || '').trim();

// Devuelve { rol: 'admin' | 'editor' | 'lector' | 'anonimo', claveInvalida }
export function rolDe(request) {
  const c = claveEnviada(request);
  if (!c) return { rol: 'anonimo', claveInvalida: false };
  if (env('ADMIN_KEY') && igualSeguro(c, env('ADMIN_KEY'))) return { rol: 'admin', claveInvalida: false };
  if (env('EDIT_KEY') && igualSeguro(c, env('EDIT_KEY'))) return { rol: 'editor', claveInvalida: false };
  if (env('READ_KEY') && igualSeguro(c, env('READ_KEY'))) return { rol: 'lector', claveInvalida: false };
  const hayClaves = env('ADMIN_KEY') || env('EDIT_KEY') || env('READ_KEY');
  return { rol: 'anonimo', claveInvalida: Boolean(hayClaves) };
}
export function esAdmin(request) { return rolDe(request).rol === 'admin'; }
// Editores y admins ven la metadata completa (IP, user-agent).
export function veMetadataCompleta(request) { return ['admin', 'editor'].includes(rolDe(request).rol); }

// ¿Puede ver/listar programas? (sin READ_KEY configurada, la lectura es pública)
export function puedeLeer(request) {
  return !env('READ_KEY') || rolDe(request).rol !== 'anonimo';
}

export function exigirLectura(request) {
  if (rolDe(request).claveInvalida) throw new ErrorApi(401, 'clave_incorrecta', 'La clave no es correcta.');
  if (!puedeLeer(request)) throw new ErrorApi(401, 'clave_requerida', 'Se necesita la clave del grupo para ver los programas.');
}

// Guardar siempre se permite. Con EDIT_KEY o ADMIN_KEY la versión queda verificada;
// sin clave (o con READ_KEY) queda "sin verificar". Una clave equivocada da 401 para avisar del error.
export function permisoEscritura(request) {
  const { rol, claveInvalida } = rolDe(request);
  if (claveInvalida) throw new ErrorApi(401, 'clave_incorrecta', 'La clave del grupo no es correcta.');
  return { verificada: rol === 'admin' || rol === 'editor', rol };
}

export function exigirAdmin(request) {
  if (!env('ADMIN_KEY')) throw new ErrorApi(403, 'admin_no_configurado', 'No hay clave de administrador configurada (ADMIN_KEY).');
  const { rol } = rolDe(request);
  if (rol !== 'admin') throw new ErrorApi(401, 'clave_admin_requerida', 'Se necesita la clave de administrador.');
}

// ── Metadata de quien guarda ────────────────────────────────────
const recortar = (v, n = 200) => (v == null ? null : String(v).slice(0, n));

function limpiarCliente(c = {}) {
  if (!c || typeof c !== 'object') return {};
  return {
    user_agent: recortar(c.user_agent, 400),
    idioma: recortar(c.idioma, 20),
    idiomas: Array.isArray(c.idiomas) ? c.idiomas.slice(0, 6).map(x => recortar(x, 20)) : null,
    zona_horaria: recortar(c.zona_horaria, 60),
    pantalla: recortar(c.pantalla, 30),
    ventana: recortar(c.ventana, 30),
    densidad: typeof c.densidad === 'number' ? c.densidad : null,
    plataforma: recortar(c.plataforma, 60),
    movil: typeof c.movil === 'boolean' ? c.movil : null,
    hora_local: recortar(c.hora_local, 40),
  };
}

export function metadataServidor(request, cliente) {
  let geo = {};
  try { geo = geolocation(request); } catch { /* fuera de Vercel */ }
  const xff = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  let ip = xff || null;
  if (!ip) { try { ip = ipAddress(request) || null; } catch { ip = null; } }
  return {
    cliente: limpiarCliente(cliente),
    servidor: {
      ip,
      pais: geo.country || null,
      region: geo.countryRegion || null,
      ciudad: geo.city || null,
      user_agent: recortar(request.headers.get('user-agent'), 400),
      recibido_en: new Date().toISOString(),
    },
  };
}

// Valida que el id sea un UUID antes de mandarlo a Postgres.
export function validarId(id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '')) {
    throw new ErrorApi(400, 'id_invalido', 'Identificador de programa inválido.');
  }
  return id;
}
