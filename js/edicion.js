/* edicion.js — Edición: modo edición, modal Configurar (applyConfig, setCode) e I.L. manuales.
   Extraído de index.html en el paso P1 (docs/00-PLAN.md). Scripts clásicos: comparten el ámbito global. */

/* ─── EDIT ─── */
function toggleEdit() {
  editMode = !editMode;
  document.body.classList.toggle('edit-mode', editMode);
  const btn = document.getElementById('editBtn');
  btn.textContent = editMode ? '✅ Guardar' : '✏️ Editar';
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
  // Separadores de día editables
  document.querySelectorAll('#prog-tbody tr.day-sep td:first-child').forEach(td => {
    td.contentEditable = on ? 'true' : 'false';
  });
}

/* ─── CONFIG ─── */
function applyConfig() {
  const grupo = document.getElementById('cfg-grupo').value;
  const rama = document.getElementById('cfg-rama').value;
  const withComunidad = document.getElementById('cfg-grupal-comunidad').checked;
  if (rama === 'Grupal') setComunidadGrupal(withComunidad);
  const fi = document.getElementById('cfg-fecha-ini').value;
  const ff = document.getElementById('cfg-fecha-fin').value;
  const hi = document.getElementById('cfg-hi').value;
  const hc = document.getElementById('cfg-hc').value;
  const resp = document.getElementById('cfg-resp').value;
  const cod = document.getElementById('cfg-cod').value;
  const titulo = document.getElementById('cfg-titulo').value;

  if (grupo) {
    document.querySelectorAll('[data-key="hdr-grupo"]').forEach(el => el.textContent = grupo);
    ['fg-a', 'fg-b'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = grupo; }); document.querySelectorAll('[data-key="hdr-grupo"]').forEach(el => el.textContent = grupo);
    localStorage.setItem(SF('hdr-grupo'), grupo);
  }
  if (rama) {
    applyRama(rama);
    document.querySelectorAll('[data-key="unidad"]').forEach(el => el.textContent = rama);
    document.querySelectorAll('[data-key="footer-rama"]').forEach(el => el.textContent = rama);
    document.getElementById('und-b').textContent = rama;
    document.getElementById('ind-rama').value = rama.toLowerCase();
  }

  // Fechas y multi-día
  if (fi) fechaIni = fi;
  if (ff) fechaFin = ff;
  if (hi) horaIniDia1 = hi;
  if (hc) horaCierreUltimo = hc;

  // Mostrar fechas en la ficha
  if (fi || ff) {
    const fechaTxt = fi && ff && fi !== ff
      ? new Date(fi + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' al ' + new Date(ff + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : fi ? new Date(fi + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    document.querySelectorAll('[data-key="fecha"]').forEach(el => el.textContent = fechaTxt);
    localStorage.setItem(SF('fecha'), fechaTxt);
  }
  // Horario
  if (hi) { document.querySelectorAll('[data-key="hora-inicio"]').forEach(el => el.textContent = hi); localStorage.setItem(SF('hora-inicio'), hi); }
  if (hc) { document.querySelectorAll('[data-key="hora-cierre"]').forEach(el => el.textContent = hc); localStorage.setItem(SF('hora-cierre'), hc); }

  // Código auto
  if (!cod && fi) {
    const d = new Date(fi + 'T00:00:00');
    const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0'), yy = String(d.getFullYear()).slice(-2);
    const rc = (rama || 'M')[0].toUpperCase(); setCode(dd + mm + yy + '-' + rc);
  }
  if (cod) setCode(cod);
  if (resp) { document.querySelectorAll('[data-key="responsable"]').forEach(el => el.textContent = resp); }
  if (titulo) { document.querySelectorAll('.hdr-title-doc').forEach(el => el.textContent = titulo); }

  // Indicar multi-día
  const md = isMultiday();
  document.getElementById('multiday-info').style.display = md ? 'block' : 'none';
  if (md) {
    // Actualizar selector de día en modal programa
    const sel = document.getElementById('p-day');
    sel.innerHTML = getDays().map((d, i) => `<option value="${i}">${d.label}</option>`).join('');
    document.getElementById('p-day-group').style.display = 'block';
  }

  recalcHoras(); syncSec(); closeM('mConfig'); saveStorage(); st('Config aplicada' + (md ? ' · Multi-día activo 📅' : ''));
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
