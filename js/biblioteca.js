/* biblioteca.js — Paso P8 (docs/00-PLAN.md): programas.html como biblioteca sin backend. Junta los programas del grupo
   (programas/index.json, generado por _herramientas/manifiesto.py) y «Mi biblioteca» (localStorage, js/biblioteca-datos.js)
   en tarjetas por rama con filtros y una vista calendario. «Abrir» lleva a index.html?abrir=… (js/biblioteca-ficha.js).
   Scripts clásicos: comparten el ámbito global. */

const $b = id => document.getElementById(id);
const escB = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const normB = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const RAMA_NOM = { manada: 'Manada', tropa: 'Tropa', comunidad: 'Comunidad', clan: 'Clan', grupal: 'Grupal', '': 'Sin rama' };

let bRepo = [], bRepoError = '', bRama = '', bVista = 'tarjetas', bMes = null;

function fechaLargaB(iso) {
  if (!iso) return 'Sin fecha';
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function haceB(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  if (s < 86400 * 30) return `hace ${Math.round(s / 86400)} días`;
  return new Date(iso).toLocaleDateString('es-VE');
}

function bTodos() {
  const locales = bibLeer().map(x => ({ fuente: 'local', id: x.id, titulo: x.titulo, rama: x.rama, fecha: x.fecha, fechaFin: x.fechaFin, momentos: x.momentos, guardado: x.guardado }));
  return [...locales, ...bRepo];
}

function bFiltrados(conRama = true) {
  const q = normB($b('bQ').value.trim()).split(/\s+/).filter(Boolean), fuente = $b('bFuente').value;
  return bTodos().filter(p => (!fuente || p.fuente === fuente) && (!conRama || !bRama || p.rama === bRama) && q.every(w => normB(p.titulo).includes(w)));
}

const bAbrirURL = p => 'index.html?abrir=' + encodeURIComponent(p.fuente === 'local' ? 'local:' + p.id : 'repo:' + p.ruta);

function bTarjeta(p) {
  const local = p.fuente === 'local';
  const rango = p.fechaFin && p.fechaFin !== p.fecha ? ` → ${escB(fechaLargaB(p.fechaFin))}` : '';
  const meta = [p.momentos ? `${p.momentos} momento${p.momentos === 1 ? '' : 's'}` : 'Sin programa', local ? 'guardado ' + haceB(p.guardado) : ''].filter(Boolean).join(' · ');
  const acciones = local
    ? `<button class="btn" data-acc="renombrar" title="Cambiar el nombre">✏️ Renombrar</button>
       <button class="btn" data-acc="duplicar" title="Hacer una copia">📑 Duplicar</button>
       <button class="btn" data-acc="descargar" title="Descargar el JSON">⬇️</button>
       <button class="btn btn-peligro" data-acc="borrar" title="Borrar de mi biblioteca">🗑️</button>`
    : `<button class="btn" data-acc="copiar" title="Guardar una copia en mi biblioteca para modificarla">📥 Copiar a mi biblioteca</button>
       <a class="btn" href="${escB(p.ruta)}" download title="Descargar el JSON">⬇️</a>`;
  return `<article class="card r-${escB(p.rama || 'sin')}" data-fuente="${p.fuente}" data-id="${escB(local ? p.id : p.ruta)}">
      <div class="card-top"><span class="badge">${escB(RAMA_NOM[p.rama] ?? p.rama)}</span><span class="b-fuente ${p.fuente}">${local ? '💾 Mi biblioteca' : '📚 Del grupo'}</span></div>
      <h3>${escB(p.titulo)}</h3>
      <div class="card-date">📅 ${escB(fechaLargaB(p.fecha))}${rango}</div>
      <div class="card-meta">${escB(meta)}</div>
      <div class="card-actions"><a class="btn btn-primary" href="${bAbrirURL(p)}">📂 Abrir en la ficha</a>${acciones}</div>
    </article>`;
}

function bPintarTabs() {
  const base = bFiltrados(false);
  document.querySelectorAll('[data-bcount]').forEach(el => {
    const r = el.dataset.bcount;
    el.textContent = r ? base.filter(p => p.rama === r).length : base.length;
  });
  document.querySelectorAll('#bTabs .tab').forEach(t => t.setAttribute('aria-selected', t.dataset.rama === bRama));
  $b('bRecursos').hidden = !(bRama === '' || bRama === 'manada');
}

function bPintarLista() {
  const lista = bFiltrados().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.guardado || '').localeCompare(a.guardado || ''));
  $b('bCount').textContent = `${lista.length} programa${lista.length === 1 ? '' : 's'}`;
  let html = lista.map(bTarjeta).join('');
  if (!lista.length) {
    html = `<div class="empty">${bTodos().length ? 'Ningún programa coincide con los filtros.' : 'Todavía no hay programas.'}<br>
      Crea uno en la <a href="index.html">Ficha</a> y usa <b>💾 Guardar en mi biblioteca</b>.</div>`;
  }
  if (bRepoError) html += `<div class="empty b-err">⚠️ No se pudieron cargar los programas del grupo: ${escB(bRepoError)}</div>`;
  $b('bLista').innerHTML = html;
}

/* ── Calendario (mes, lunes primero) ── */
const isoDia = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function bMesInicial(lista) {
  const hoy = new Date(), clave = isoDia(hoy).slice(0, 7);
  const conFecha = lista.filter(p => p.fecha);
  if (!conFecha.length || conFecha.some(p => p.fecha.startsWith(clave))) return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const t = hoy.getTime();
  const cerca = conFecha.reduce((a, b) => Math.abs(new Date(b.fecha) - t) < Math.abs(new Date(a.fecha) - t) ? b : a);
  const d = new Date(cerca.fecha + 'T00:00:00'); return new Date(d.getFullYear(), d.getMonth(), 1);
}
function bPintarCal() {
  const lista = bFiltrados();
  if (!bMes) bMes = bMesInicial(lista);
  const mes = bMes.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });
  $b('bCalMes').textContent = mes.charAt(0).toUpperCase() + mes.slice(1);
  const primero = new Date(bMes), desfase = (primero.getDay() + 6) % 7;
  const inicio = new Date(primero); inicio.setDate(1 - desfase);
  const hoy = isoDia(new Date());
  let html = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(d => `<div class="b-cal-dow">${d}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicio); d.setDate(inicio.getDate() + i);
    const iso = isoDia(d), fuera = d.getMonth() !== bMes.getMonth();
    if (i >= 35 && fuera && d.getDate() < 8) break;
    const del = lista.filter(p => p.fecha && p.fecha <= iso && (p.fechaFin || p.fecha) >= iso);
    html += `<div class="b-cal-dia${fuera ? ' fuera' : ''}${iso === hoy ? ' hoy' : ''}"><span class="b-cal-n">${d.getDate()}</span>
      ${del.map(p => `<a class="b-cal-ev r-${escB(p.rama || 'sin')}" href="${bAbrirURL(p)}" title="${escB(p.titulo)} — abrir en la ficha">${p.fuente === 'local' ? '💾 ' : ''}${escB(p.titulo)}</a>`).join('')}</div>`;
  }
  $b('bCalGrid').innerHTML = html;
  const n = lista.filter(p => p.fecha && p.fecha.slice(0, 7) === isoDia(bMes).slice(0, 7)).length;
  $b('bCount').textContent = `${n} programa${n === 1 ? '' : 's'} este mes`;
}

function bPintarUso() {
  const u = bibUso(), n = bibLeer().length;
  $b('bUsoBarra').style.width = Math.max(1, Math.round(u.pct * 100)) + '%';
  $b('bUsoBarra').classList.toggle('cerca', u.cerca);
  $b('bUsoTxt').textContent = `${n} programa${n === 1 ? '' : 's'} · usas ${bibMB(u.bytes)} de ~${bibMB(u.limite)} (${Math.round(u.pct * 100)} %)`;
  $b('bUsoAviso').hidden = !u.cerca;
  $b('bUsoAviso').textContent = '⚠️ Te queda poco espacio en este navegador. Exporta tu biblioteca (respaldo) y borra los programas que ya no uses.';
}

function bPintar() {
  bPintarTabs(); bPintarUso();
  $b('bLista').hidden = bVista !== 'tarjetas'; $b('bCal').hidden = bVista !== 'calendario';
  if (bVista === 'tarjetas') bPintarLista(); else bPintarCal();
}

function bError(e, titulo) { aviso(e.lleno ? 'No hay espacio en este navegador. No se cambió nada: exporta tu biblioteca y borra programas viejos.' : e.message, titulo); }

/* ── Acciones de las tarjetas ── */
function bRenombrar(card) {
  const h3 = card.querySelector('h3'), id = card.dataset.id, antes = h3.textContent;
  const inp = document.createElement('input'); inp.className = 'b-renombrar'; inp.value = antes; inp.setAttribute('aria-label', 'Nuevo nombre');
  h3.replaceWith(inp); inp.focus(); inp.select();
  let hecho = false;
  const fin = guardar => {
    if (hecho) return; hecho = true;
    const nuevo = inp.value.trim();
    if (guardar && nuevo && nuevo !== antes) { try { bibRenombrar(id, nuevo); } catch (e) { bError(e, '✏️ Renombrar'); } }
    bPintar();
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') fin(true); if (e.key === 'Escape') fin(false); });
  inp.addEventListener('blur', () => fin(true));
}

async function bAccion(btn) {
  const card = btn.closest('.card'), id = card.dataset.id, acc = btn.dataset.acc;
  try {
    if (acc === 'renombrar') return bRenombrar(card);
    if (acc === 'duplicar') { bibDuplicar(id); bPintar(); return; }
    if (acc === 'descargar') { const it = bibObtener(id); bibDescargar(it.datos, it.titulo); return; }
    if (acc === 'borrar') {
      const it = bibObtener(id);
      const ok = await dialogo({ titulo: '🗑️ Borrar de mi biblioteca', texto: `¿Borrar «${it.titulo}»? No se puede deshacer (si lo necesitas, descárgalo antes con ⬇️).`, aceptar: 'Sí, borrar', cancelar: 'Cancelar', peligro: true });
      if (ok) { bibBorrar(id); bPintar(); }
      return;
    }
    if (acc === 'copiar') {
      const r = await fetch(id); if (!r.ok) throw new Error('no se encontró ' + id);
      bibGuardar(await r.json());
      $b('bFuente').value = ''; bPintar();
      aviso('Quedó una copia en «Mi biblioteca». Ábrela en la ficha para modificarla.', '📥 Copiado');
    }
  } catch (e) { bError(e, 'No se pudo completar'); }
}

async function bCargarRepo() {
  try {
    const r = await fetch('programas/index.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('falta programas/index.json');
    const m = await r.json();
    bRepo = (m.programas || []).map(p => ({ ...p, fuente: 'repo', id: p.ruta }));
    bRepoError = '';
  } catch (e) { bRepo = []; bRepoError = e.message; }
  bPintar();
}

document.addEventListener('DOMContentLoaded', () => {
  let t = null;
  $b('bQ').addEventListener('input', () => { clearTimeout(t); t = setTimeout(bPintar, 120); });
  $b('bFuente').addEventListener('change', bPintar);
  $b('bTabs').addEventListener('click', e => { const tab = e.target.closest('.tab'); if (tab) { bRama = tab.dataset.rama; bPintar(); } });
  document.querySelectorAll('.b-vista button').forEach(b => b.addEventListener('click', () => {
    bVista = b.dataset.vista;
    document.querySelectorAll('.b-vista button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    bPintar();
  }));
  $b('bCalAnt').addEventListener('click', () => { bMes = new Date(bMes.getFullYear(), bMes.getMonth() - 1, 1); bPintarCal(); });
  $b('bCalSig').addEventListener('click', () => { bMes = new Date(bMes.getFullYear(), bMes.getMonth() + 1, 1); bPintarCal(); });
  $b('bCalHoy').addEventListener('click', () => { const h = new Date(); bMes = new Date(h.getFullYear(), h.getMonth(), 1); bPintarCal(); });
  $b('bLista').addEventListener('click', e => { const btn = e.target.closest('button[data-acc]'); if (btn) bAccion(btn); });
  $b('bExportar').addEventListener('click', () => {
    if (!bibLeer().length) { aviso('Tu biblioteca está vacía: todavía no hay nada que exportar.', '⬇️ Exportar'); return; }
    bibDescargar(bibExportar(), 'biblioteca-ficha-scout-' + isoDia(new Date()));
  });
  $b('bImportar').addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const res = bibImportar(JSON.parse(r.result));
        aviso(`Nuevos: ${res.nuevos} · actualizados: ${res.actualizados} · ya estaban: ${res.iguales}.`, '⬆️ Biblioteca importada');
        bPintar();
      } catch (err) { bError(err instanceof SyntaxError ? new Error('El archivo no es un JSON válido.') : err, '⬆️ No se pudo importar'); }
    };
    r.readAsText(f);
  });
  // Otra pestaña (la Ficha) guardó algo: refrescar
  window.addEventListener('storage', e => { if (e.key === BIB_CLAVE) bPintar(); });
  bCargarRepo();
});
