// GET /api/salud → estado de la nube y modo de acceso (sin datos sensibles).
// Si se envía una clave (x-clave-grupo), también dice qué rol tiene: admin, editor, lector o anónimo.
import { json, rolDe } from './_lib/http.js';
import { hayBaseDeDatos, query } from './_lib/db.js';

export async function GET(request) {
  const { rol, claveInvalida } = rolDe(request);
  const estado = {
    ok: true,
    base_de_datos: hayBaseDeDatos(),
    conectada: false,
    edicion_configurada: Boolean(process.env.EDIT_KEY), // guardar con EDIT_KEY = versión verificada
    lectura_protegida: Boolean(process.env.READ_KEY),
    admin_configurado: Boolean(process.env.ADMIN_KEY),
    rol,
    clave_invalida: claveInvalida,
  };
  if (estado.base_de_datos) {
    try { await query('SELECT 1'); estado.conectada = true; }
    catch (e) { estado.ok = false; estado.error = 'No se pudo conectar a la base de datos.'; console.error('[salud]', e.message); }
  } else {
    estado.ok = false;
  }
  return json(estado, estado.ok ? 200 : 503);
}
