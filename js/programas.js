/* programas.js — Lógica de programas.html: pestañas por rama, lista, historial y modo admin (nube apagada por js/config.js).
   Extraído de programas.html en el paso P1 (docs/00-PLAN.md). Script clásico. */

const API = 'api/programas';
const RAMA_NOMBRE = { manada: 'Manada', tropa: 'Tropa', comunidad: 'Comunidad', clan: 'Clan', grupal: 'Grupal' };
const $ = s => document.querySelector(s);
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { } },
};
const ss = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { } },
  del(k) { try { sessionStorage.removeItem(k); } catch { } },
};
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sinAcentos = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

let ramaSel = new URLSearchParams(location.search).get('rama') ?? ls.get('programas_rama') ?? '';
if (ramaSel && !RAMA_NOMBRE[ramaSel]) ramaSel = '';
let programas = [];
let claveAdmin = ss.get('scout_admin');
let verArchivados = false;

function fechaLarga(iso) {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso + 'T00:00:00');
  const t = d.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function haceCuanto(ts) {
  if (!ts) return '';
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  if (s < 86400 * 30) return `hace ${Math.round(s / 86400)} días`;
  return new Date(ts).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Petición a la API. Usa la clave de admin si hay sesión admin; si no, la clave del grupo.
async function pedir(url, { method = 'GET', body, clave } = {}) {
  const h = {};
  const k = clave ?? claveAdmin ?? ls.get('scout_clave');
  if (k) h['x-clave-grupo'] = k;
  if (body !== undefined) h['content-type'] = 'application/json';
  let res;
  try { res = await fetch(url, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw Object.assign(new Error('No se pudo conectar con la nube. Revisa tu conexión a internet.'), { red: true }); }
  let data = null; try { data = await res.json(); } catch { }
  if (!data) throw new Error(res.status === 404 ? 'La nube no está configurada en este sitio todavía.' : `Error ${res.status} del servidor.`);
  if (res.status === 401) throw Object.assign(new Error(data.mensaje), { clave: true, codigo: data.error });
  if (!data.ok) throw Object.assign(new Error(data.mensaje || 'Error al consultar la nube.'), { codigo: data.error });
  return data;
}

// 🐺 Recursos de la Manada: visibles en «Todas» y en «Manada».
function pintarRecursos() { $('#recursosManada').hidden = !(ramaSel === '' || ramaSel === 'manada'); }

function pintarTabs(conteo = {}) {
  let total = 0;
  Object.values(conteo).forEach(n => total += n);
  document.querySelectorAll('.tab').forEach(t => {
    t.setAttribute('aria-selected', String(t.dataset.rama === ramaSel));
    const r = t.dataset.rama;
    const n = r ? (conteo[r] || 0) : total;
    const c = t.querySelector('[data-count]');
    if (c) c.textContent = (n === 1 ? '1 programa' : `${n} programas`) + (verArchivados ? ' archiv.' : '');
    if (r === 'grupal') t.hidden = !conteo.grupal && ramaSel !== 'grupal';
  });
}

function tarjeta(p) {
  const admin = Boolean(claveAdmin);
  const arch = Boolean(p.archivado_at);
  const acciones = arch
    ? `<button class="btn btn-primary" onclick="archivar('${esc(p.id)}', false)">♻️ Desarchivar</button>`
    : `<a class="btn btn-primary" href="index.html?id=${encodeURIComponent(p.id)}">📂 Abrir</a>`;
  return `
        <article class="card r-${esc(p.rama)}${arch ? ' archivado' : ''}">
          <div class="card-top"><span class="badge">${esc(RAMA_NOMBRE[p.rama] || p.rama)}</span><span>v${p.version_actual}</span><span>· ${esc(haceCuanto(p.updated_at))}</span>
            ${arch ? '<span class="tag-arch">ARCHIVADO</span>' : ''}</div>
          <h3>${esc(p.titulo)}</h3>
          <div class="card-date">📅 ${esc(fechaLarga(p.fecha))}${p.fecha_fin && p.fecha_fin !== p.fecha ? ` → ${esc(fechaLarga(p.fecha_fin))}` : ''}</div>
          <div class="card-meta">${p.ultimo_autor ? `✍️ Última versión por ${esc(p.ultimo_autor)}` : '✍️ Autor no indicado'}
            ${p.ultima_verificada === false ? ' <span class="tag-nv" title="Guardada sin la clave del grupo">sin verificar</span>' : ''}
            ${arch ? `<br>🗄️ Archivado ${esc(haceCuanto(p.archivado_at))}${p.archivado_por ? ' por ' + esc(p.archivado_por) : ''}` : ''}</div>
          <div class="card-actions">
            ${acciones}
            <button class="btn" onclick="verHistorial('${esc(p.id)}')">🕑 Historial</button>
            ${admin && !arch ? `<button class="btn btn-peligro" onclick="archivar('${esc(p.id)}', true)">🗄️ Archivar</button>` : ''}
            ${admin ? `<button class="btn btn-peligro" onclick="borrarPrograma('${esc(p.id)}')">🗑️ Borrar</button>` : ''}
          </div>
        </article>`;
}

function pintarLista() {
  const q = sinAcentos($('#q').value.trim());
  const lista = programas.filter(p => !q || sinAcentos(p.titulo).includes(q));
  $('#count').textContent = lista.length ? `${lista.length} de ${programas.length}` : '';
  if (!lista.length) {
    $('#list').innerHTML = `<div class="empty">${programas.length
          ? 'Ningún programa coincide con la búsqueda.'
          : verArchivados
            ? `No hay programas archivados${ramaSel ? ` de <b>${RAMA_NOMBRE[ramaSel]}</b>` : ''}.`
            : `Todavía no hay programas${ramaSel ? ` de <b>${RAMA_NOMBRE[ramaSel]}</b>` : ''} en la nube.<br>Abre la <a href="index.html" style="color:var(--yellow)">plantilla</a> y usa <b>☁️ Guardar</b>.`}</div>`;
    return;
  }
  $('#list').innerHTML = lista.map(tarjeta).join('');
}

function pedirClave(mensaje) {
  $('#list').innerHTML = `<div class="empty">🔒 ${esc(mensaje || 'Se necesita la clave del grupo.')}
        <div class="clave-box"><input class="search" id="clave" type="password" placeholder="Clave del grupo" autocomplete="off">
        <button class="btn btn-primary" onclick="guardarClave()">Entrar</button></div></div>`;
  $('#clave').addEventListener('keydown', e => { if (e.key === 'Enter') guardarClave(); });
  $('#clave').focus();
}
function guardarClave() { const v = $('#clave').value.trim(); if (v) { ls.set('scout_clave', v); cargar(); } }

let tBuscar = null, ultimaPeticion = 0;
const NUBE_ACTIVA = Boolean(window.SCOUT_CONFIG && window.SCOUT_CONFIG.nube);
async function cargar() {
  // ⚙️ Versión GitHub Pages (js/config.js → nube: false): no hay API que consultar.
  if (!NUBE_ACTIVA) {
    $('#list').innerHTML = `<div class="empty">📚 La biblioteca compartida de programas todavía no está disponible en esta versión.<br>
          Por ahora cada ficha se guarda en tu navegador. Para compartirla, usa <b>📤 Exportar datos</b> en la <a href="index.html" style="color:var(--yellow)">plantilla</a>.</div>`;
    return;
  }
  const n = ++ultimaPeticion;
  pintarTabs();
  $('#list').innerHTML = '<div class="empty">Cargando programas…</div>';
  try {
    const data = await pedir(`${API}?limite=500${ramaSel ? `&rama=${ramaSel}` : ''}${verArchivados ? '&archivados=1' : ''}`);
    if (n !== ultimaPeticion) return;
    programas = data.programas;
    if (data.total_archivados != null) $('#nArch').textContent = `(${data.total_archivados})`;
    pintarTabs(data.conteo);
    pintarLista();
  } catch (e) {
    if (n !== ultimaPeticion) return;
    if (e.clave && claveAdmin) { salirAdmin(); return aviso('La clave de administrador ya no es válida. Vuelve a entrar.', '🔐 Sesión de administrador'); }
    if (e.clave) return pedirClave(e.message);
    $('#list').innerHTML = `<div class="empty">⚠️ ${esc(e.message)}</div>`;
  }
}

// ── Historial ──
let histId = null;
async function verHistorial(id) {
  histId = id;
  const p = programas.find(x => x.id === id);
  $('#histTitle').textContent = `🕑 Historial — ${p ? p.titulo : ''}`;
  $('#histBody').innerHTML = '<p style="font-size:12px;color:rgba(255,255,255,.6)">Cargando…</p>';
  $('#mHist').classList.add('open');
  try {
    const { versiones } = await pedir(`${API}/${encodeURIComponent(id)}/versiones`);
    const archivado = Boolean(p?.archivado_at);
    $('#histBody').innerHTML = versiones.map((v, i) => {
      const m = v.metadata || {};
      const lugar = [m.ciudad || m.servidor?.ciudad, m.pais || m.servidor?.pais].filter(Boolean).join(', ');
      const disp = m.plataforma || m.cliente?.plataforma;
      const ip = m.servidor?.ip; // solo llega con clave de edición o de admin
      return `<div class="ver">
            <span class="ver-num">v${v.version}</span>
            <div class="ver-body">
              <b>${esc(v.autor || 'Autor no indicado')}</b>${i === 0 ? '<span class="ver-actual">● ACTUAL</span>' : ''}
              ${v.verificada === false ? ' <span class="tag-nv" title="Guardada sin la clave del grupo">sin verificar</span>' : ''}
              <small>${esc(new Date(v.created_at).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' }))}${v.origen === 'migracion' ? ' · migrado del repositorio' : ''}</small>
              <small>${[lugar && '📍 ' + esc(lugar), disp && '💻 ' + esc(disp), ip && 'IP ' + esc(ip)].filter(Boolean).join(' · ')}</small>
            </div>
            <div class="ver-acc">
              ${archivado ? '' : `<a class="btn btn-sm" href="index.html?id=${encodeURIComponent(id)}${i === 0 ? '' : `&version=${v.version}`}">📂 Abrir</a>`}
              ${claveAdmin && versiones.length > 1 ? `<button class="btn btn-sm btn-peligro" onclick="borrarVersion(${v.version})" title="Borrar esta versión">🗑️</button>` : ''}
            </div>
          </div>`;
    }).join('') || '<p>No hay versiones.</p>';
  } catch (e) {
    $('#histBody').innerHTML = `<p style="font-size:12px">⚠️ ${esc(e.message)}</p>`;
  }
}
function cerrarHist() { $('#mHist').classList.remove('open'); histId = null; }
$('#mHist').addEventListener('click', e => { if (e.target.id === 'mHist') cerrarHist(); });

// ── Administración ──
function pintarAdmin() {
  const on = Boolean(claveAdmin);
  document.body.classList.toggle('es-admin', on);
  $('#adminBtn').textContent = on ? '🔓 Admin' : '🔐 Admin';
  $('#adminBtn').classList.toggle('admin-on', on);
  $('#adminBtn').title = on ? 'Modo administrador activo' : 'Entrar como administrador';
  if (!on) { verArchivados = false; $('#verArch').checked = false; $('#nArch').textContent = ''; }
}
function clickAdmin() {
  if (claveAdmin) { $('#adminBar').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  $('#adminMsg').textContent = ''; $('#adminClave').value = '';
  $('#mAdmin').classList.add('open'); $('#adminClave').focus();
}
function cerrarAdmin() { $('#mAdmin').classList.remove('open'); }
async function entrarAdmin() {
  const k = $('#adminClave').value.trim();
  if (!k) return;
  $('#adminEntrar').disabled = true; $('#adminMsg').textContent = '';
  try {
    const r = await fetch('api/salud', { headers: { 'x-clave-grupo': k } });
    const s = await r.json();
    if (!s.admin_configurado) { $('#adminMsg').textContent = 'No hay clave de administrador configurada en el servidor (ADMIN_KEY).'; return; }
    if (s.rol !== 'admin') { $('#adminMsg').textContent = 'Clave de administrador incorrecta.'; return; }
    claveAdmin = k; ss.set('scout_admin', k);
    cerrarAdmin(); pintarAdmin(); cargar();
  } catch {
    $('#adminMsg').textContent = 'No se pudo contactar la nube.';
  } finally { $('#adminEntrar').disabled = false; }
}
function salirAdmin() {
  claveAdmin = null; ss.del('scout_admin'); pintarAdmin(); cargar();
}
$('#adminClave').addEventListener('keydown', e => { if (e.key === 'Enter') entrarAdmin(); });
$('#mAdmin').addEventListener('click', e => { if (e.target.id === 'mAdmin') cerrarAdmin(); });
$('#verArch').addEventListener('change', e => { verArchivados = e.target.checked; cargar(); });

async function archivar(id, archivar) {
  const p = programas.find(x => x.id === id);
  const ok = await dialogo(archivar
    ? { titulo: '🗄️ Archivar programa', texto: `«${p?.titulo || ''}» dejará de aparecer en la lista y su link dejará de abrirse.\n\nNo se borra nada: puedes desarchivarlo cuando quieras desde «Ver archivados».`, aceptar: 'Archivar', peligro: true }
    : { titulo: '♻️ Desarchivar programa', texto: `«${p?.titulo || ''}» volverá a aparecer en la lista de su rama.`, aceptar: 'Desarchivar' });
  if (!ok) return;
  try {
    await pedir(`${API}/${encodeURIComponent(id)}`, { method: 'PATCH', body: { archivado: archivar, autor: 'Administrador' } });
    cargar();
  } catch (e) { aviso(e.message, '⚠️ No se pudo completar'); }
}

async function borrarPrograma(id) {
  const p = programas.find(x => x.id === id);
  const ok = await dialogo({
    titulo: '🗑️ Borrar programa definitivamente',
    html: `<p>Se borrará <b>«${esc(p?.titulo || '')}»</b> con <b>todas sus versiones (${p?.version_actual ?? '?'})</b>.</p>
               <p>Esto <b>no se puede deshacer</b>. Si solo quieres ocultarlo, usa <b>Archivar</b>.</p>`,
    aceptar: 'Borrar para siempre', peligro: true, palabra: 'BORRAR',
  });
  if (!ok) return;
  try {
    const r = await pedir(`${API}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await aviso(`Se borró «${r.borrado.titulo}» (${r.borrado.versiones} versiones).`, '🗑️ Programa borrado');
    cargar();
  } catch (e) { aviso(e.message, '⚠️ No se pudo borrar'); }
}

async function borrarVersion(numero) {
  const id = histId; if (!id) return;
  const ok = await dialogo({
    titulo: `🗑️ Borrar la versión v${numero}`,
    html: `<p>Se borrará solo la <b>v${numero}</b>; las demás versiones se mantienen. Si era la actual, la actual pasa a ser la más reciente que quede.</p><p>Esto <b>no se puede deshacer</b>.</p>`,
    aceptar: `Borrar v${numero}`, peligro: true, palabra: 'BORRAR',
  });
  if (!ok) return;
  try {
    await pedir(`${API}/${encodeURIComponent(id)}/versiones/${numero}`, { method: 'DELETE' });
    await cargar();
    verHistorial(id);
  } catch (e) { aviso(e.message, '⚠️ No se pudo borrar'); }
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { cerrarHist(); cerrarAdmin(); } });

$('#tabs').addEventListener('click', e => {
  const t = e.target.closest('.tab'); if (!t) return;
  ramaSel = t.dataset.rama;
  ls.set('programas_rama', ramaSel);
  const u = new URL(location.href); if (ramaSel) u.searchParams.set('rama', ramaSel); else u.searchParams.delete('rama');
  history.replaceState(null, '', u);
  pintarRecursos();
  cargar();
});
$('#q').addEventListener('input', () => { clearTimeout(tBuscar); tBuscar = setTimeout(pintarLista, 150); });

if (!NUBE_ACTIVA) { $('#adminBtn').hidden = true; document.querySelector('.foot').hidden = true; }
pintarAdmin();
pintarRecursos();
cargar();
