/* edicion.js — Edición: modo edición, código (setCode, codigoAuto) e I.L. manuales.
   Extraído de index.html en el paso P1 (docs/00-PLAN.md). Scripts clásicos: comparten el ámbito global. */

/* ─── EDIT ─── */
function toggleEdit() {
  editMode = !editMode;
  document.body.classList.toggle('edit-mode', editMode);
  const btn = document.getElementById('editBtn');
  btn.textContent = editMode ? '✅ Guardar' : '✏️ Editar ficha';
  btn.classList.toggle('on', editMode);
  if (typeof syncEditBtnM === 'function') syncEditBtnM();
  // Campos generales
  document.querySelectorAll('[data-edit="true"]').forEach(el => {
    el.contentEditable = editMode ? 'true' : 'false';
    if (editMode) el.oninput = () => {
      const v = el.innerHTML || el.textContent;
      localStorage.setItem('sf_' + el.dataset.key, v);
      if (el.dataset.key === 'hora-inicio') { horaIniDia1 = el.textContent.trim() || '10:00'; recalcHoras(); }
      if (el.dataset.key === 'hora-cierre') { horaCierreUltimo = el.textContent.trim() || '13:00'; }
      syncSec(); recalcHoras();
    };
  });
  // Nombre actividad en header
  const na = document.getElementById('hdr-nombre-act');
  if (na) {
    na.contentEditable = editMode ? 'true' : 'false';
    if (editMode) na.oninput = () => {
      const v = na.innerHTML || na.textContent;
      localStorage.setItem('sf_nombre-act', v);
      syncSec();
    };
  }
  // Título del documento
  document.querySelectorAll('.hdr-title-doc').forEach(dtEl => {
    dtEl.contentEditable = editMode ? 'true' : 'false';
    if (editMode) dtEl.oninput = () => {
      const v = dtEl.textContent.trim();
      document.querySelectorAll('.hdr-title-doc').forEach(e => { if (e !== dtEl) e.textContent = v; });
      localStorage.setItem(SF('doc-title'), v);
    };
  });
  // Ambientación
  const am = document.getElementById('hdr-ambientacion');
  if (am) {
    am.contentEditable = editMode ? 'true' : 'false';
    if (editMode) am.oninput = () => { localStorage.setItem('sf_ambientacion', am.innerHTML || am.textContent); syncEmpty(); };
  }
  // Celdas del programa
  enableProgEdit(editMode);
  syncExtraEditable();
  if (!editMode) { autoSplitExtraPages(); saveStorage(); syncSec(); st('✅ Guardado'); }
}

function enableProgEdit(on) {
  document.querySelectorAll('#prog-tbody td.p-dur,#prog-tbody td.p-act,#prog-tbody td.p-desc-cell,#prog-tbody td.p-mat,#prog-tbody td.p-resp').forEach(td => {
    td.contentEditable = on ? 'true' : 'false';
    td.classList.toggle('editable', on);
    if (on) td.oninput = () => { syncProgRows(); if (td.classList.contains('p-dur')) recalcHoras(); };
  });
}

/* ─── CÓDIGO ─── (el panel de configuración vive en js/config-panel.js) */
// DDMMAA-R desde la fecha de inicio y la inicial de la rama (Manada M, Tropa T, Comunidad/Clan C, Grupal G)
function codigoAuto() {
  if (!fechaIni) return '';
  const d = new Date(fechaIni + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0'), yy = String(d.getFullYear()).slice(-2);
  return dd + mm + yy + '-' + (ramaActual || 'm')[0].toUpperCase();
}
function setCode(c) { ['cod-a', 'cod-b', 'cod-c', 'cod-g2'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = c; }); localStorage.setItem(SF('codigo'), c); syncExtraHeaders(); }

function toggleManualInd() {
  const f = document.getElementById('ind-manual-form');
  const a = document.getElementById('manual-arrow');
  const open = f.style.display !== 'none';
  f.style.display = open ? 'none' : 'block';
  a.textContent = open ? '▶' : '▼';
}
function addIndManual() {
  const area = document.getElementById('ind-m-area').value.trim();
  const etapa = document.getElementById('ind-m-etapa').value.trim();
  const texto = document.getElementById('ind-m-texto').value.trim();
  if (!texto) { st('Escribe el texto del indicador'); return; }
  indRows.push({ area: area || '—', etapa: etapa || '—', texto });
  renderInd(); saveStorage(); st('Indicador agregado');
  document.getElementById('ind-m-area').value = '';
  document.getElementById('ind-m-etapa').value = '';
  document.getElementById('ind-m-texto').value = '';
}
