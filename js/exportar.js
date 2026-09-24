/* exportar.js — Exportar / importar JSON, guardar HTML y PDF (window.print).
   Extraído de index.html en el paso P1 (docs/00-PLAN.md). Scripts clásicos: comparten el ámbito global. */

/* ─── EXPORT/IMPORT ─── */
// Datos del programa en el formato de "Exportar datos" (también lo usa js/nube.js).
function buildExportData() {
  const d = {};
  document.querySelectorAll('[data-key]').forEach(el => d[el.dataset.key] = el.innerHTML || el.textContent);
  const na = document.getElementById('hdr-nombre-act'); if (na) d['nombre-act'] = na.innerHTML || na.textContent;
  const am = document.getElementById('hdr-ambientacion'); if (am) d['ambientacion'] = am.innerHTML || am.textContent;
  const epData = []; document.querySelectorAll('.extra-page-wrap').forEach(wrap => { epData.push({ id: wrap.dataset.epId, titulo: wrap.querySelector('.ep-titulo').innerHTML, body: wrap.querySelector('.ep-body').innerHTML }); });
  const dtExp = document.getElementById('doc-title')?.textContent?.trim() || 'FICHA TÉCNICA';
  return { _data: d, _indicadores_extra: Object.fromEntries(Object.entries(INDICADORES).filter(([k]) => !IND_BASE.includes(k))), _ods: [...odsActivos], _prog: progRows, _horas_dia: horasDia, _ind: indRows, _logos: customLogos, _extra_pages: epData, _fechaIni: fechaIni, _fechaFin: fechaFin, _rama: ramaActual, _doc_title: dtExp, _hora_ini: horaIniDia1, _hora_cierre: horaCierreUltimo, _grupal_comunidad: localStorage.getItem(SF('grupal-comunidad')) === '1', _codigo: codigoActual() };
}
function codigoActual() { const c = document.getElementById('cod-a')?.textContent?.trim(); return c && c !== '—' ? c : ''; }
function doExportJSON() {
  const out = buildExportData();
  const na = document.getElementById('hdr-nombre-act');
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = (na?.textContent?.trim() || 'ficha') + '.json'; a.click();
}
function doImportJSON(file) {
  if (!file) return; const r = new FileReader();
  r.onload = e => {
    // Un archivo importado ya no es el programa de la biblioteca del que venía la ficha: se corta el vínculo
    try { importarDatos(JSON.parse(e.target.result)); localStorage.removeItem(SF('biblio_id')); }
    catch (err) { if (window.aviso) aviso('El archivo no es un JSON válido de la ficha: ' + err.message, '📥 No se pudo importar'); else alert('Error JSON: ' + err.message); }
  };
  r.readAsText(file);
}
// Aplica a la ficha un objeto en el formato de «Exportar datos» (archivo, biblioteca local o programas del repo)
function importarDatos(d, mensaje = 'JSON importado ✅') {
  if (d._data) {
    Object.entries(d._data).forEach(([k, v]) => { const el = document.querySelector(`[data-key="${k}"]`); if (el) { el.innerHTML = v; localStorage.setItem(SF(k), v); } });
    if (d._data['nombre-act']) ['hdr-nombre-act', 'p2-nombre'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = d._data['nombre-act']; });
    if (d._data['ambientacion']) { const el = document.getElementById('hdr-ambientacion'); if (el) el.innerHTML = d._data['ambientacion']; }
  }
  if (d._indicadores_extra) Object.entries(d._indicadores_extra).forEach(([k, v]) => { if (!IND_BASE.includes(k)) INDICADORES[k] = v; });
  if (d._ods) { odsActivos = new Set(d._ods); renderODS(); }
  if (d._horas_dia) horasDia = d._horas_dia;
  if (d._prog) progRows = d._prog;
  if (d._ind) { indRows = corregirIL(d._ind); renderInd(); }
  if (d._logos) { customLogos = d._logos; Object.entries(d._logos).forEach(([id, src]) => applyLogo(id, src)); }
  if (d._fechaIni) fechaIni = d._fechaIni;
  if (d._fechaFin) fechaFin = d._fechaFin;
  if (d._rama) applyRama(d._rama);
  // Los JSON de Tico y los del repo no traen _rama: se toma de «Unidad» si es una rama conocida
  else if (/^(manada|tropa|comunidad|clan|grupal)$/i.test((d._data?.unidad || '').trim())) applyRama(d._data.unidad.trim());
  if (d._doc_title) document.querySelectorAll('.hdr-title-doc').forEach(el => el.textContent = d._doc_title);
  if (d._hora_ini) horaIniDia1 = d._hora_ini;
  if (d._hora_cierre) horaCierreUltimo = d._hora_cierre;
  // El programa se dibuja después de fechas y horas: de ellas dependen los días y las horas de cada momento
  if (d._prog) { renderProg(); enableProgEdit(editMode); }
  // Código: se respeta si el JSON lo trae; si no, se genera desde la fecha de inicio y la rama
  if (d._codigo) setCode(d._codigo); else if (fechaIni) setCode(codigoAuto());
  if (d._extra_pages && d._extra_pages.length) { document.getElementById('extraPagesContainer').innerHTML = ''; extraPages = []; d._extra_pages.forEach(p => addExtraPage(p.id, p.titulo, p.body)); autoSplitExtraPages(); }
  saveStorage(); syncSec(); st(mensaje);
  if (typeof progPanelRefrescar === 'function') progPanelRefrescar();
}

/* P7: exportar (JSON/PDF) solo cuando la ficha tiene contenido. Lo llama js/indice.js cada vez que cambia la ficha. */
function fichaTieneContenido() {
  const t = sel => (document.querySelector(sel)?.textContent || '').trim();
  return !!(t('#hdr-nombre-act') || progRows.some(r => (r.act || '').trim()) || t('[data-key="obj-general"]') || t('[data-key="obj-especificos"]'));
}
function exportarActualizar() {
  const ok = fichaTieneContenido();
  document.querySelectorAll('[data-requiere-contenido]').forEach(b => {
    b.disabled = !ok;
    if (!b.dataset.tituloOk) b.dataset.tituloOk = b.title || '';
    b.title = ok ? b.dataset.tituloOk : 'Para exportar, escribe el nombre de la actividad o agrega un momento u objetivo';
  });
}

function doPDF() { if (editMode) toggleEdit(); autoSplitExtraPages(); fitAllHdrNombres(); fitAllAmbientacion(); window.print(); }
