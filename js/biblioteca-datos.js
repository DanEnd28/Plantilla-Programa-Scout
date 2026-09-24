/* biblioteca-datos.js — Paso P8 (docs/00-PLAN.md): «Mi biblioteca», varios programas guardados en este navegador
   (localStorage) sin backend. Lo usan la Ficha (guardar / abrir) y programas.html (listar, renombrar, duplicar, borrar,
   exportar e importar). Clave propia fuera de sf_* a propósito: «Restablecer» borra sf_* y la biblioteca debe quedar.
   Scripts clásicos: comparten el ámbito global. */

const BIB_CLAVE = 'biblio_programas';
// Los navegadores dan ~5 MB por sitio a localStorage (Chrome cuenta ~5 millones de caracteres). Se mide en caracteres
// (1 carácter ≈ 1 byte para mostrarlo en MB) y se avisa al 80 %.
const BIB_LIMITE = 5 * 1024 * 1024;
const BIB_AVISO = 0.8;
const BIB_RAMAS = ['manada', 'tropa', 'comunidad', 'clan', 'grupal'];

const bibTexto = h => { const t = document.createElement('div'); t.innerHTML = h || ''; return (t.textContent || '').replace(/\s+/g, ' ').trim(); };

function bibLeer() {
  const raw = localStorage.getItem(BIB_CLAVE);
  if (!raw) return [];
  try { const l = JSON.parse(raw); return Array.isArray(l) ? l : []; }
  // Si el dato está dañado no se sobrescribe: se avisa y se trabaja con una lista vacía en memoria
  catch { console.warn('Biblioteca dañada en localStorage; no se toca.'); return []; }
}

// Lanza un Error con .lleno = true si no hay espacio. localStorage.setItem es atómico: si falla, queda lo anterior.
function bibEscribir(lista) {
  try { localStorage.setItem(BIB_CLAVE, JSON.stringify(lista)); }
  catch (e) {
    const err = new Error('No hay espacio en la biblioteca de este navegador.');
    err.lleno = /quota/i.test(e.name + e.message) || e.code === 22;
    throw err;
  }
}

function bibUso() {
  let chars = 0;
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); chars += k.length + (localStorage.getItem(k) || '').length; }
  const bytes = chars;
  return { bytes, limite: BIB_LIMITE, pct: Math.min(1, bytes / BIB_LIMITE), cerca: bytes / BIB_LIMITE >= BIB_AVISO };
}
const bibMB = b => (b / 1024 / 1024).toLocaleString('es-VE', { maximumFractionDigits: 2 }) + ' MB';

// Datos del listado a partir del JSON de la ficha (formato de «Exportar datos»)
function bibResumen(datos) {
  const d = datos._data || {};
  const unidad = (d.unidad ? bibTexto(d.unidad) : '').toLowerCase();
  const rama = BIB_RAMAS.includes(datos._rama) ? datos._rama : (BIB_RAMAS.includes(unidad) ? unidad : '');
  return {
    titulo: bibTexto(d['nombre-act']) || 'Sin nombre',
    rama,
    fecha: datos._fechaIni || '',
    fechaFin: datos._fechaFin || '',
    momentos: (datos._prog || []).filter(m => m.type !== 'day-sep').length,
  };
}

const bibNuevoId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Crea o actualiza (si `id` existe). Devuelve el elemento guardado.
function bibGuardar(datos, id) {
  const lista = bibLeer();
  const previo = id && lista.find(x => x.id === id);
  const item = { ...(previo || {}), id: previo ? id : bibNuevoId(), ...bibResumen(datos), guardado: new Date().toISOString(), datos };
  if (previo) lista[lista.indexOf(previo)] = item; else lista.unshift(item);
  bibEscribir(lista);
  return item;
}

function bibObtener(id) { return bibLeer().find(x => x.id === id) || null; }

function bibBorrar(id) { bibEscribir(bibLeer().filter(x => x.id !== id)); }

function bibRenombrar(id, titulo) {
  const lista = bibLeer(), item = lista.find(x => x.id === id); if (!item) return;
  item.titulo = titulo;
  item.datos._data = { ...(item.datos._data || {}), 'nombre-act': escHTMLBib(titulo) };
  item.guardado = new Date().toISOString();
  bibEscribir(lista);
}
const escHTMLBib = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function bibDuplicar(id) {
  const item = bibObtener(id); if (!item) return null;
  const datos = JSON.parse(JSON.stringify(item.datos));
  const titulo = item.titulo + ' (copia)';
  datos._data = { ...(datos._data || {}), 'nombre-act': escHTMLBib(titulo) };
  return bibGuardar(datos);
}

function bibExportar() {
  return { tipo: 'biblioteca-ficha-scout', version: 1, exportado: new Date().toISOString(), programas: bibLeer() };
}

// Acepta una biblioteca exportada o un JSON suelto de la ficha. Si un id ya existe, gana el guardado más reciente.
function bibImportar(obj) {
  const lista = bibLeer();
  let nuevos = 0, actualizados = 0, iguales = 0;
  const entrantes = obj && obj.tipo === 'biblioteca-ficha-scout' && Array.isArray(obj.programas)
    ? obj.programas.filter(p => p && p.datos)
    : obj && obj._data ? [{ id: bibNuevoId(), ...bibResumen(obj), guardado: new Date().toISOString(), datos: obj }] : null;
  if (!entrantes) throw new Error('El archivo no es una biblioteca ni una ficha exportada.');
  entrantes.forEach(p => {
    const i = lista.findIndex(x => x.id === p.id);
    if (i < 0) { lista.push({ ...p, ...bibResumen(p.datos), titulo: p.titulo || bibResumen(p.datos).titulo }); nuevos++; }
    else if ((p.guardado || '') > (lista[i].guardado || '')) { lista[i] = p; actualizados++; }
    else iguales++;
  });
  bibEscribir(lista);
  return { nuevos, actualizados, iguales };
}

function bibDescargar(obj, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
  a.download = nombre.replace(/[\\/:*?"<>|]+/g, '-') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
