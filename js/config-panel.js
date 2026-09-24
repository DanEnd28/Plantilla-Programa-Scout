/* config-panel.js — Panel lateral derecho de Configuración general (paso P4 de docs/00-PLAN.md): cada campo se aplica
   en vivo a la ficha y se guarda solo (mismas claves sf_* de siempre); «Deshacer» revierte el último cambio (pila en memoria).
   Reemplaza al modal mConfig y a applyConfig(). El mismo panel muestra también la vista Programa (js/programa-panel.js).
   Scripts clásicos: comparten el ámbito global. */

const $cfg = id => document.getElementById(id);
const CFG_CAMPOS = ['cfg-grupo', 'cfg-rama', 'cfg-grupal-comunidad', 'cfg-resp', 'cfg-titulo', 'cfg-cod', 'cfg-fecha-ini', 'cfg-fecha-fin', 'cfg-hi', 'cfg-hc'];
const CFG_TEXTO = ['cfg-grupo', 'cfg-resp', 'cfg-titulo', 'cfg-cod'];
const fmtFecha = f => new Date(f + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const RAMA_NOMBRE = { manada: 'Manada', tropa: 'Tropa', comunidad: 'Comunidad', clan: 'Clan', grupal: 'Grupal' };

/* ── Aplicar un campo (misma lógica que el antiguo applyConfig, separada por campo para no pisar lo editado en la ficha) ── */
function cfgAplicarGrupo() {
  const v = $cfg('cfg-grupo').value.trim(); if (!v) return;
  document.querySelectorAll('[data-key="hdr-grupo"]').forEach(el => el.textContent = v);
  ['fg-a', 'fg-b'].forEach(id => { const el = $cfg(id); if (el) el.textContent = v; });
}
function cfgAplicarRama() {
  const rama = $cfg('cfg-rama').value;
  onRamaChange(rama);
  if (rama === 'Grupal') setComunidadGrupal($cfg('cfg-grupal-comunidad').checked);
  applyRama(rama);
  document.querySelectorAll('[data-key="unidad"], [data-key="footer-rama"]').forEach(el => el.textContent = rama);
  $cfg('und-b').textContent = rama;
  $cfg('ind-rama').value = rama.toLowerCase();
  cfgCodigoSiAuto();
}
function cfgAplicarFechas() {
  const fi = $cfg('cfg-fecha-ini').value, ff = $cfg('cfg-fecha-fin').value;
  if (fi) fechaIni = fi;
  if (ff) fechaFin = ff;
  if (fi || ff) {
    const txt = fi && ff && fi !== ff ? fmtFecha(fi) + ' al ' + fmtFecha(ff) : fi ? fmtFecha(fi) : '';
    document.querySelectorAll('[data-key="fecha"]').forEach(el => el.textContent = txt);
  }
  $cfg('multiday-info').style.display = isMultiday() ? 'block' : 'none';
  renderProg(); enableProgEdit(editMode);
  cfgCodigoSiAuto();
}
function cfgAplicarHoras() {
  const hi = $cfg('cfg-hi').value, hc = $cfg('cfg-hc').value;
  if (hi) { horaIniDia1 = hi; document.querySelectorAll('[data-key="hora-inicio"]').forEach(el => el.textContent = hi); }
  if (hc) { horaCierreUltimo = hc; document.querySelectorAll('[data-key="hora-cierre"]').forEach(el => el.textContent = hc); }
}
function cfgAplicarResp() {
  const v = $cfg('cfg-resp').value.trim(); if (!v) return;
  document.querySelectorAll('[data-key="responsable"]').forEach(el => el.textContent = v);
}
function cfgAplicarTitulo() {
  const v = $cfg('cfg-titulo').value.trim(); if (!v) return;
  document.querySelectorAll('.hdr-title-doc').forEach(el => el.textContent = v);
}
function cfgCodigoSiAuto() {
  const v = $cfg('cfg-cod').value.trim();
  if (v) setCode(v); else if (fechaIni) setCode(codigoAuto());
}

const CFG_APLICAR = {
  'cfg-grupo': cfgAplicarGrupo, 'cfg-rama': cfgAplicarRama, 'cfg-grupal-comunidad': cfgAplicarRama,
  'cfg-resp': cfgAplicarResp, 'cfg-titulo': cfgAplicarTitulo, 'cfg-cod': cfgCodigoSiAuto,
  'cfg-fecha-ini': cfgAplicarFechas, 'cfg-fecha-fin': cfgAplicarFechas, 'cfg-hi': cfgAplicarHoras, 'cfg-hc': cfgAplicarHoras,
};

function cfgAplicar(ids) {
  new Set(ids.map(id => CFG_APLICAR[id])).forEach(fn => fn());
  recalcHoras(); syncSec(); saveStorage();
  progPanelRefrescar();
  st(isMultiday() ? '✅ Guardado · Multi-día 📅' : '✅ Guardado');
}

/* ── Deshacer: fotos de los valores del panel antes de cada cambio ── */
let cfgPila = [], cfgUltimo = null;
const cfgTimers = {};
function cfgFoto() { return Object.fromEntries(CFG_CAMPOS.map(id => [id, $cfg(id).type === 'checkbox' ? $cfg(id).checked : $cfg(id).value])); }
function cfgPush() { cfgPila.push(cfgUltimo); $cfg('cfgUndo').disabled = false; }

function cfgCambio(id) {
  const texto = CFG_TEXTO.includes(id);
  // Una ráfaga de teclas en el mismo campo cuenta como un solo cambio para Deshacer
  if (!cfgTimers[id]) cfgPush();
  clearTimeout(cfgTimers[id]);
  cfgTimers[id] = setTimeout(() => { cfgTimers[id] = null; cfgAplicar([id]); cfgUltimo = cfgFoto(); }, texto ? 350 : 0);
}

function cfgDeshacer() {
  const previo = cfgPila.pop(); if (!previo) return;
  Object.values(cfgTimers).forEach(clearTimeout); Object.keys(cfgTimers).forEach(k => cfgTimers[k] = null);
  const actual = cfgFoto();
  const cambiados = CFG_CAMPOS.filter(id => previo[id] !== actual[id]);
  cambiados.forEach(id => { if ($cfg(id).type === 'checkbox') $cfg(id).checked = previo[id]; else $cfg(id).value = previo[id]; });
  if (cambiados.length) cfgAplicar(cambiados);
  cfgUltimo = previo;
  $cfg('cfgUndo').disabled = !cfgPila.length;
  st('↶ Cambio deshecho');
}

/* ── Abrir / cerrar / pestañas ── */
function cfgRellenar() {
  const txt = sel => document.querySelector(sel)?.textContent?.trim() || '';
  $cfg('cfg-grupo').value = txt('[data-key="hdr-grupo"]') || 'Grupo Scout La Salle Guaparo';
  $cfg('cfg-resp').value = txt('[data-key="responsable"]') || 'Akela';
  $cfg('cfg-titulo').value = txt('#doc-title') || 'FICHA TÉCNICA';
  $cfg('cfg-rama').value = RAMA_NOMBRE[ramaActual] || 'Manada';
  $cfg('cfg-grupal-comunidad').checked = $cfg('fichaWrap').classList.contains('grupal-con-comunidad');
  onRamaChange($cfg('cfg-rama').value);
  $cfg('cfg-fecha-ini').value = fechaIni || '';
  $cfg('cfg-fecha-fin').value = fechaFin || '';
  $cfg('cfg-hi').value = horaIniDia1 || '10:00';
  $cfg('cfg-hc').value = horaCierreUltimo || '13:00';
  // Si el código es el automático (o no hay), el campo queda vacío para que siga generándose solo
  const cod = txt('#cod-a');
  $cfg('cfg-cod').value = !cod || cod === '—' || cod === codigoAuto() ? '' : cod;
  $cfg('multiday-info').style.display = isMultiday() ? 'block' : 'none';
}

/* El panel derecho tiene dos vistas: 'config' (este archivo) y 'programa' (js/programa-panel.js) */
const PANEL_TITULOS = { config: '⚙️ Configuración', programa: '🗓️ Programa', indice: '📋 Secciones' };
function panelVista() { return document.body.classList.contains('cfg-abierto') ? document.body.dataset.panel : null; }
function panelMostrar(vista) {
  document.body.dataset.panel = vista;
  document.querySelectorAll('#cfgPanel [data-vista]').forEach(el => el.hidden = el.dataset.vista !== vista);
  $cfg('cfgTitle').textContent = PANEL_TITULOS[vista];
  $cfg('cfgUndo').hidden = vista !== 'config';
  if (!document.body.classList.contains('cfg-abierto')) panelFocoPrevio = document.activeElement;
  document.body.classList.add('cfg-abierto');
  scalePages();
  // El foco entra al panel (teclado / lector de pantalla); al cerrarlo vuelve al botón que lo abrió
  setTimeout(() => $cfg('cfgTitle').focus({ preventScroll: true }), 30);
}
let panelFocoPrevio = null;

function openConfigPanel() {
  if (panelVista() === 'programa') progLimpiarVacios();
  cfgRellenar();
  cfgPila = []; cfgUltimo = cfgFoto(); $cfg('cfgUndo').disabled = true;
  panelMostrar('config');
}
function closeConfigPanel() {
  if (!panelVista()) return;
  if (panelVista() === 'programa') progLimpiarVacios();
  document.body.classList.remove('cfg-abierto');
  scalePages();
  if (panelFocoPrevio && document.contains(panelFocoPrevio) && panelFocoPrevio.offsetParent !== null) panelFocoPrevio.focus();
  panelFocoPrevio = null;
}
function toggleConfigPanel() {
  if (panelVista() === 'config') closeConfigPanel(); else openConfigPanel();
}

CFG_CAMPOS.forEach(id => {
  const el = $cfg(id);
  el.addEventListener(CFG_TEXTO.includes(id) ? 'input' : 'change', () => cfgCambio(id));
});
