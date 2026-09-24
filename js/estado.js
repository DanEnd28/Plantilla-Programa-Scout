/* estado.js — Estado global de la ficha, utilidades de fechas, guardado en localStorage (saveStorage/loadStorage) y restablecer.
   Extraído de index.html en el paso P1 (docs/00-PLAN.md). Scripts clásicos: comparten el ámbito global. */

/* ─── ESTADO ─── */
let editMode = false, customLogos = {}, odsActivos = new Set(),
  progRows = [], indRows = [], ramaActual = 'manada';
let fechaIni = null, fechaFin = null, horaIniDia1 = '10:00', horaCierreUltimo = '13:00';

/* ─── UTIL FECHAS ─── */
function daysBetween(a, b) {
  const d1 = new Date(a + 'T00:00:00'), d2 = new Date(b + 'T00:00:00');
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-VE', { weekday: 'long', day: '2-digit', month: 'long' });
}
function isMultiday() {
  return fechaIni && fechaFin && daysBetween(fechaIni, fechaFin) > 0;
}
function getDays() {
  if (!isMultiday()) return [];
  const days = [];
  const n = daysBetween(fechaIni, fechaFin) + 1;
  for (let i = 0; i < n; i++) {
    const d = new Date(fechaIni + 'T00:00:00');
    d.setDate(d.getDate() + i);
    days.push({
      idx: i,
      label: 'Día ' + (i + 1) + ' — ' + d.toLocaleDateString('es-VE', { weekday: 'long', day: '2-digit', month: 'long' })
    });
  }
  return days;
}

/* ─── STORAGE ─── */
const SF = k => 'sf_' + k;
function saveStorage() {
  document.querySelectorAll('[data-key]').forEach(el => localStorage.setItem(SF(el.dataset.key), el.innerHTML || el.textContent));
  const na = document.getElementById('hdr-nombre-act'); if (na) localStorage.setItem(SF('nombre-act'), na.innerHTML || na.textContent);
  const am = document.getElementById('hdr-ambientacion'); if (am) localStorage.setItem(SF('ambientacion'), am.innerHTML || am.textContent);
  localStorage.setItem(SF('logos'), JSON.stringify(customLogos));
  localStorage.setItem(SF('ods'), JSON.stringify([...odsActivos]));
  localStorage.setItem(SF('prog'), JSON.stringify(progRows));
  localStorage.setItem(SF('ind'), JSON.stringify(indRows));
  localStorage.setItem(SF('rama'), ramaActual);
  localStorage.setItem(SF('fecha-ini'), fechaIni || '');
  localStorage.setItem(SF('fecha-fin'), fechaFin || '');
  localStorage.setItem(SF('hora-ini-d1'), horaIniDia1);
  localStorage.setItem(SF('hora-cierre-ul'), horaCierreUltimo);
  const dtSave = document.getElementById('doc-title'); if (dtSave) localStorage.setItem(SF('doc-title'), dtSave.textContent.trim());
  const extra = Object.fromEntries(Object.entries(INDICADORES).filter(([k]) => !IND_BASE.includes(k)));
  if (Object.keys(extra).length) localStorage.setItem(SF('ind_extra'), JSON.stringify(extra));
}
function loadStorage() {
  document.querySelectorAll('[data-key]').forEach(el => { const v = localStorage.getItem(SF(el.dataset.key)); if (v !== null) el.innerHTML = v; });
  const na = localStorage.getItem(SF('nombre-act')); if (na) { ['hdr-nombre-act', 'p2-nombre', 'p3-nombre', 'g2-nombre'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = na; }); }
  const am = localStorage.getItem(SF('ambientacion')); if (am) { const el = document.getElementById('hdr-ambientacion'); if (el) el.innerHTML = am; }
  const logos = localStorage.getItem(SF('logos')); if (logos) { customLogos = JSON.parse(logos); Object.entries(customLogos).forEach(([id, src]) => applyLogo(id, src)); }
  const ods = localStorage.getItem(SF('ods')); if (ods) odsActivos = new Set(JSON.parse(ods));
  const prog = localStorage.getItem(SF('prog')); if (prog) progRows = JSON.parse(prog);
  const ind = localStorage.getItem(SF('ind')); if (ind) indRows = JSON.parse(ind);
  const rama = localStorage.getItem(SF('rama')); if (rama) { ramaActual = rama; applyRama(rama); }
  const gc = localStorage.getItem(SF('grupal-comunidad')); if (gc === '1' && ramaActual === 'grupal') { setComunidadGrupal(true); document.getElementById('cfg-grupal-comunidad').checked = true; }
  if (ramaActual === 'grupal') document.getElementById('cfg-grupal-opts').style.display = 'block';
  fechaIni = localStorage.getItem(SF('fecha-ini')) || null;
  fechaFin = localStorage.getItem(SF('fecha-fin')) || null;
  horaIniDia1 = localStorage.getItem(SF('hora-ini-d1')) || '10:00';
  horaCierreUltimo = localStorage.getItem(SF('hora-cierre-ul')) || '13:00';
  // Load doc-title
  const dtLoad = localStorage.getItem(SF('doc-title'));
  if (dtLoad) document.querySelectorAll('.hdr-title-doc').forEach(el => el.textContent = dtLoad);
  // Apply defaults on first load
  const grupoEl = document.querySelector('[data-key="hdr-grupo"]');
  if (grupoEl && !grupoEl.textContent.trim()) {
    grupoEl.textContent = 'La Salle Guaparo';
    ['fg-a', 'fg-b'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = 'La Salle Guaparo'; });
  }
  // Sync hora DOM elements with loaded variables
  document.querySelectorAll('[data-key="hora-inicio"]').forEach(el => { if (!el.textContent.trim()) el.textContent = horaIniDia1; });
  document.querySelectorAll('[data-key="hora-cierre"]').forEach(el => { if (!el.textContent.trim()) el.textContent = horaCierreUltimo; });
  const extra = localStorage.getItem(SF('ind_extra')); if (extra) Object.entries(JSON.parse(extra)).forEach(([k, v]) => { if (!IND_BASE.includes(k)) INDICADORES[k] = v; });
}

/* ─── RESET ─── */
function doReset() {
  if (document.getElementById('rst-pdf').checked) window.print();
  if (document.getElementById('rst-json').checked) doExportJSON();
  const keep = [SF('ind_extra'), SF('rama')];
  Object.keys(localStorage).filter(k => k.startsWith('sf_') && !keep.includes(k)).forEach(k => localStorage.removeItem(k));
  customLogos = {}; odsActivos = new Set(); progRows = []; indRows = [];
  fechaIni = null; fechaFin = null;
  document.querySelectorAll('[data-key]').forEach(el => el.innerHTML = '');
  ['hdr-nombre-act', 'hdr-ambientacion', 'p2-nombre'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
  document.querySelectorAll('.hdr-title-doc').forEach(el => el.textContent = 'FICHA TÉCNICA');
  localStorage.removeItem(SF('doc-title'));
  document.getElementById('ind-tbody').innerHTML = '';
  document.getElementById('prog-tbody').innerHTML = '';
  document.getElementById('extraPagesContainer').innerHTML = ''; extraPages = [];
  renderODS(); applyRama(ramaActual);
  document.querySelectorAll('img[id^="logo-grupo"]').forEach(el => el.src = LOGO_GRUPO_DEF); document.querySelectorAll('.ep-logo-g').forEach(el => el.src = LOGO_GRUPO_DEF);
  syncSec(); closeM('mReset'); st('Plantilla restablecida 🗑️');
  if (window.nubeTrasRestablecer) window.nubeTrasRestablecer();
}
