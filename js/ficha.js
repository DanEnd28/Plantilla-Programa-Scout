/* ficha.js — Render de la ficha: rama, logos, ODS, I.L., programa por momentos, arrastrar filas, sincronización de campos, ajuste de texto, modo grupal y páginas extra.
   Extraído de index.html en el paso P1 (docs/00-PLAN.md). Scripts clásicos: comparten el ámbito global. */

/* ─── RAMAS ─── */
function applyRama(rama) {
  ramaActual = rama.toLowerCase();
  const fw = document.getElementById('fichaWrap');
  const wasComunidad = fw.classList.contains('grupal-con-comunidad');
  fw.className = 'rama-' + ramaActual;
  if (wasComunidad && ramaActual === 'grupal') fw.classList.add('grupal-con-comunidad');
  const isGrupal = ramaActual === 'grupal';
  applyGrupalLayout(isGrupal);
  if (!isGrupal && !customLogos['logo-rama']) {
    const src = RAMA_LOGOS[ramaActual] || RAMA_LOGOS.manada;
    ['logo-rama', 'logo-rama-p2', 'logo-rama-g2'].forEach(id => { const el = document.getElementById(id); if (el) el.src = src; });
  }
}

/* ─── LOGOS ─── */
function setLogo(id, input) {
  const key = id.replace(/-(p2|p3|g2)$/, '');
  const file = input.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = e => { customLogos[key] = e.target.result; applyLogo(key, e.target.result); saveStorage(); st('Logo actualizado'); };
  r.readAsDataURL(file);
}
function applyLogo(key, src) {
  if (key === 'logo-grupo') {
    document.querySelectorAll('img[id^="logo-grupo"]').forEach(el => el.src = src);
    document.querySelectorAll('.ep-logo-g').forEach(el => el.src = src);
  } else if (key === 'logo-rama') {
    document.querySelectorAll('img[id^="logo-rama"]').forEach(el => el.src = src);
    document.querySelectorAll('.ep-logo-r').forEach(el => el.src = src);
  } else {
    document.querySelectorAll(`img[data-logo-key="${key}"]`).forEach(el => el.src = src);
  }
}

/* ─── ODS ─── */
function renderODS() {
  const wrap = document.getElementById('ods-wrap'); wrap.innerHTML = '';
  ODS_LIST.forEach(o => {
    const on = odsActivos.has(o.num);
    const c = document.createElement('div');
    c.className = 'ods-chip' + (on ? ' on' : ''); c.dataset.active = on ? 'true' : 'false';
    c.style.background = o.color; c.innerHTML = `<b>${o.num}</b> ${o.nombre}`;
    c.title = `ODS ${o.num}: ${o.nombre}`;
    c.onclick = () => { on ? odsActivos.delete(o.num) : odsActivos.add(o.num); renderODS(); saveStorage(); };
    wrap.appendChild(c);
  });
}

/* ─── INDICADORES ─── */
function renderInd() {
  const tb = document.getElementById('ind-tbody'); tb.innerHTML = '';
  indRows.forEach((r, idx) => {
    const cls = AREA_CLS[r.area] || '';
    const tr = document.createElement('tr');

    const tdA = document.createElement('td');
    tdA.className = `col-area ${cls}`;
    const spA = document.createElement('span');
    spA.className = 'ind-editable';
    spA.contentEditable = 'true';
    spA.textContent = r.area;
    spA.addEventListener('blur', () => { if (indRows[idx]) { indRows[idx].area = spA.textContent.trim(); saveStorage(); } });
    tdA.appendChild(spA);

    const tdE = document.createElement('td');
    tdE.className = 'col-e';
    const spE = document.createElement('span');
    spE.className = 'ind-editable';
    spE.contentEditable = 'true';
    spE.textContent = r.etapa;
    spE.style.textAlign = 'center';
    spE.addEventListener('blur', () => { if (indRows[idx]) { indRows[idx].etapa = spE.textContent.trim(); saveStorage(); } });
    tdE.appendChild(spE);

    const tdT = document.createElement('td');
    tdT.className = 'col-ind';
    tdT.style.position = 'relative';
    const spT = document.createElement('span');
    spT.className = 'ind-editable';
    spT.contentEditable = 'true';
    spT.textContent = r.texto;
    spT.addEventListener('blur', () => { if (indRows[idx]) { indRows[idx].texto = spT.textContent.trim(); saveStorage(); } });
    const delB = document.createElement('button');
    delB.className = 'del-btn';
    delB.textContent = '✕';
    delB.addEventListener('click', (e) => { e.stopPropagation(); delInd(idx); });
    tdT.append(spT, delB);

    tr.append(tdA, tdE, tdT);
    tb.appendChild(tr);
  });
}
function delInd(i) { indRows.splice(i, 1); renderInd(); saveStorage(); }
function renderIndPanel() {
  const rama = document.getElementById('ind-rama').value;
  const panel = document.getElementById('ind-panel'); panel.innerHTML = '';
  const data = INDICADORES[rama];
  if (!data) { panel.innerHTML = `<p style="color:#aaa;font-size:10px;padding:10px">Sin indicadores. Importa un JSON y haz 💾 HTML.</p>`; return; }
  Object.entries(data).forEach(([area, etapas]) => {
    const grp = document.createElement('div'); grp.className = 'ind-grp';
    const title = document.createElement('div'); title.className = 'ind-grp-title';
    title.innerHTML = `${area} <span>▶</span>`;
    const items = document.createElement('div'); items.className = 'ind-items';
    title.onclick = () => { items.classList.toggle('open'); title.querySelector('span').textContent = items.classList.contains('open') ? '▼' : '▶'; };
    Object.entries(etapas).forEach(([etapa, lista]) => lista.forEach(texto => {
      const item = document.createElement('label'); item.className = 'ind-item';
      const chk = document.createElement('input'); chk.type = 'checkbox';
      chk.dataset.area = area; chk.dataset.etapa = etapa; chk.dataset.texto = texto;
      const badge = document.createElement('span'); badge.className = 'e-badge'; badge.textContent = etapa;
      item.append(chk, badge, ' ' + texto); items.appendChild(item);
    }));
    grp.append(title, items); panel.appendChild(grp);
  });
}
function applyInd() {
  document.querySelectorAll('#ind-panel input:checked').forEach(chk => {
    indRows.push({ area: chk.dataset.area, etapa: chk.dataset.etapa, texto: chk.dataset.texto });
  });
  renderInd(); closeM('mInd'); saveStorage(); st('Indicadores agregados');
}

/* ─── PROGRAMA ─── */
function parseMins(s) {
  if (!s) return 0; s = s.toLowerCase().trim(); let t = 0;
  const h = s.match(/(\d+)\s*h/); if (h) t += parseInt(h[1]) * 60;
  const m = s.match(/(\d+)\s*min/); if (m) t += parseInt(m[1]);
  if (!h && !m) { const n = parseInt(s); if (!isNaN(n)) t = n; }
  return t;
}
function addMins(time, mins) {
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  const tot = hh * 60 + mm + mins;
  return String(Math.floor(tot / 60) % 24).padStart(2, '0') + ':' + String(tot % 60).padStart(2, '0');
}

function recalcHoras() {
  let cur = horaIniDia1;
  document.querySelectorAll('#prog-tbody tr').forEach(tr => {
    if (tr.classList.contains('day-sep')) {
      // El separador tiene su propia hora de inicio
      const hEl = tr.querySelector('.day-hora');
      if (hEl && hEl.textContent.trim()) cur = hEl.textContent.trim();
      return;
    }
    const hEl = tr.querySelector('.p-hora'); if (hEl) hEl.textContent = cur;
    const m = parseMins(tr.querySelector('.p-dur')?.textContent || ''); if (m > 0) cur = addMins(cur, m);
  });
  updateProgHdr();
}

function renderProg() {
  const tb = document.getElementById('prog-tbody'); tb.innerHTML = '';
  let cur = horaIniDia1;
  progRows.forEach(r => {
    if (r.type === 'day-sep') {
      const tr = makeDaySepTr(r.label || 'Día', r.startTime || '');
      tb.appendChild(tr);
      if (r.startTime) cur = r.startTime;
      return;
    }
    tb.appendChild(makeProgTr(cur, r.dur || '', r.act || '', r.desc || '', r.mat || '', r.resp || ''));
    const m = parseMins(r.dur || ''); if (m > 0) cur = addMins(cur, m);
  });
  updateProgHdr();
}

function makeProgTr(hora, dur, act, desc, mat, resp) {
  const tr = document.createElement('tr'); tr.draggable = true;
  tr.innerHTML = `
    <td class="p-drag" title="Arrastrar">☰</td>
    <td class="p-hora">${hora}</td>
    <td class="p-dur ${editMode ? 'editable' : ''}" contenteditable="${editMode}">${dur}</td>
    <td class="p-act ${editMode ? 'editable' : ''}" contenteditable="${editMode}">${act}</td>
    <td class="p-desc-cell ${editMode ? 'editable' : ''}" contenteditable="${editMode}">${desc}</td>
    <td class="p-mat ${editMode ? 'editable' : ''}" contenteditable="${editMode}">${mat}</td>
    <td class="p-resp ${editMode ? 'editable' : ''}" contenteditable="${editMode}">${resp}</td>
    <td class="col-del"><button class="del-btn" onclick="delProgTr(this)">✕</button></td>`;
  tr.querySelectorAll('[contenteditable="true"]').forEach(td => {
    td.oninput = () => { syncProgRows(); if (td.classList.contains('p-dur')) recalcHoras(); };
  });
  return tr;
}

function makeDaySepTr(label, startTime) {
  const tr = document.createElement('tr');
  tr.className = 'day-sep'; tr.draggable = true;
  const horaDisplay = startTime ? ` <span style="font-size:9px;opacity:.75;font-weight:400">${startTime}</span>` : '';
  tr.innerHTML = `
    <td class="p-drag" style="background:inherit;color:rgba(255,255,255,.5)">☰</td>
    <td colspan="5" class="${editMode ? 'editable' : ''}" contenteditable="${editMode}">${label}</td>
    <td class="day-hora" style="display:none">${startTime || ''}</td>
    <td colspan="1" style="text-align:right;padding-right:6px;font-size:9px;opacity:.7;">${startTime || ''}</td>
    <td class="col-del"><button class="del-btn" style="color:rgba(255,255,255,.6)" onclick="delProgTr(this)">✕</button></td>`;
  return tr;
}

function addDaySep() {
  const days = getDays();
  let label, startTime;
  if (days.length > 0) {
    // En multi-día, preguntar qué día
    const opts = days.map((d, i) => `${i + 1}. ${d.label}`).join('\n');
    const sel = prompt('¿Para qué día?\n' + opts, '1');
    if (!sel) return;
    const idx = parseInt(sel) - 1;
    if (isNaN(idx) || idx < 0 || idx >= days.length) { st('Día inválido'); return; }
    label = days[idx].label;
    startTime = prompt('Hora de inicio de este día (Ej: 08:00):', '08:00');
    if (!startTime) return;
  } else {
    label = prompt('Nombre del día (Ej: Viernes 01 mayo):', 'Día 1');
    if (!label) return;
    startTime = prompt('Hora de inicio de este día:', '08:00');
    if (!startTime) return;
  }
  progRows.push({ type: 'day-sep', label, startTime });
  renderProg(); enableProgEdit(editMode); saveStorage(); st('Separador de día agregado');
}

function syncProgRows() {
  progRows = [];
  document.querySelectorAll('#prog-tbody tr').forEach(tr => {
    if (tr.classList.contains('day-sep')) {
      const td = tr.querySelectorAll('td');
      progRows.push({
        type: 'day-sep',
        label: td[1]?.textContent || 'Día',
        startTime: tr.querySelector('.day-hora')?.textContent || ''
      });
      return;
    }
    progRows.push({
      dur: tr.querySelector('.p-dur')?.textContent || '',
      act: tr.querySelector('.p-act')?.textContent || '',
      desc: tr.querySelector('.p-desc-cell')?.innerHTML || '',
      mat: tr.querySelector('.p-mat')?.textContent || '',
      resp: tr.querySelector('.p-resp')?.textContent || ''
    });
  });
}

function addProgRow() {
  const dur = document.getElementById('p-dur').value;
  const horaManual = document.getElementById('p-hora').value.trim();
  const tb = document.getElementById('prog-tbody');
  let cur = horaIniDia1;
  tb.querySelectorAll('tr').forEach(tr => {
    if (tr.classList.contains('day-sep')) { const h = tr.querySelector('.day-hora')?.textContent; if (h) cur = h; return; }
    const m = parseMins(tr.querySelector('.p-dur')?.textContent || ''); if (m > 0) cur = addMins(cur, m);
  });
  if (horaManual) cur = horaManual;
  const tr = makeProgTr(cur, dur, document.getElementById('p-act').value, document.getElementById('p-desc').value, document.getElementById('p-mat').value, document.getElementById('p-resp').value);
  tb.appendChild(tr);
  if (editMode) enableProgEdit(true);
  syncProgRows(); recalcHoras(); closeM('mProg');
  ['p-hora', 'p-dur', 'p-act', 'p-desc', 'p-mat', 'p-resp'].forEach(id => document.getElementById(id).value = '');
  saveStorage(); st('Fila agregada');
}
function delProgTr(btn) { btn.closest('tr').remove(); syncProgRows(); recalcHoras(); saveStorage(); }
function updateProgHdr() {
  const hi = document.querySelector('[data-key="hora-inicio"]')?.textContent?.trim() || horaIniDia1 || '';
  const hc = document.querySelector('[data-key="hora-cierre"]')?.textContent?.trim() || horaCierreUltimo || '';
  const el = document.getElementById('prog-hdr');
  if (el) el.textContent = hi ? (hi + (hc ? ' — ' + hc : '')) : '';
}

/* ─── DRAG ─── */
function initDrag() {
  const tb = document.getElementById('prog-tbody'); let src = null;
  tb.addEventListener('dragstart', e => { src = e.target.closest('tr'); if (src) src.classList.add('dragging'); });
  tb.addEventListener('dragover', e => {
    e.preventDefault(); const tgt = e.target.closest('tr');
    if (tgt && tgt !== src) { const r = tgt.getBoundingClientRect(); tb.insertBefore(src, e.clientY > r.top + r.height / 2 ? tgt.nextSibling : tgt); }
  });
  tb.addEventListener('dragend', () => { if (src) src.classList.remove('dragging'); syncProgRows(); recalcHoras(); saveStorage(); });
}

/* ─── SYNC ─── */
function syncSec() {
  const na = document.getElementById('hdr-nombre-act');
  const p2 = document.getElementById('p2-nombre');
  if (na && p2) p2.innerHTML = na.innerHTML || na.textContent;
  const ca = document.getElementById('cod-a'); const cb = document.getElementById('cod-b'); if (ca && cb) cb.textContent = ca.textContent;
  const ua = document.querySelector('[data-key="unidad"]'); const ub = document.getElementById('und-b'); const uc = document.getElementById('und-c'); if (ua && ub) ub.textContent = ua.textContent; if (ua && uc) uc.textContent = ua.textContent;
  updateProgHdr();
  syncEmpty();
  fitAllHdrNombres();
  fitAllAmbientacion();
}

/* ── AJUSTE AUTOMÁTICO DE TEXTO EN HEADER/AMBIENTACIÓN ──
   Si el texto es muy largo, reduce el tamaño de fuente hasta que
   quepa en `maxLines` líneas (en vez de desbordar y empujar el
   header, o cortarse feo al imprimir). */
function fitToLines(el, baseSize, maxLines, minSize) {
  if (!el) return;
  el.style.fontSize = '';
  if (!el.textContent || !el.textContent.trim()) return;
  let size = baseSize;
  el.style.fontSize = size + 'px';
  let lh = parseFloat(getComputedStyle(el).lineHeight) || size * 1.3;
  let guard = 0;
  while (el.scrollHeight > lh * maxLines + 1 && size > minSize && guard < 24) {
    size -= 0.5;
    el.style.fontSize = size + 'px';
    lh = parseFloat(getComputedStyle(el).lineHeight) || size * 1.3;
    guard++;
  }
}
function fitAllHdrNombres() {
  document.querySelectorAll('.hdr-nombre').forEach(el => fitToLines(el, 11, 2, 7.5));
}
function fitAllAmbientacion() {
  document.querySelectorAll('.amb-val').forEach(el => fitToLines(el, 10, 1, 7));
}

function syncEmpty() {
  // Ocultar en print secciones de texto opcionales vacías
  document.querySelectorAll('[data-optional="true"]').forEach(sec => {
    const body = sec.querySelector('.sec-body');
    const empty = !body || body.textContent.trim() === '';
    sec.classList.toggle('print-hide', empty);
  });
  // Ocultar ambientación si vacía
  const ambBar = document.querySelector('.ambientacion-bar');
  const ambVal = document.getElementById('hdr-ambientacion');
  if (ambBar && ambVal) ambBar.classList.toggle('print-hide', ambVal.textContent.trim() === '');
  // Ocultar info-sec-items vacíos (lugar, fecha, hora, etc.)
  document.querySelectorAll('.info-sec-item').forEach(item => {
    const val = item.querySelector('.info-sec-val');
    const empty = !val || val.textContent.trim() === '';
    item.classList.toggle('print-hide', empty);
  });
}

/* ── MODO GRUPAL ── */
let modoGrupal = false;

function onRamaChange(val) {
  document.getElementById('cfg-grupal-opts').style.display = val === 'Grupal' ? 'block' : 'none';
}

function applyGrupalLayout(isGrupal) {
  modoGrupal = isGrupal;
  const sg = document.getElementById('main-sec-group');
  const g2c = document.getElementById('blk-g2-content');
  const blk1c = document.querySelector('#blk1 .page-content');

  if (isGrupal && sg && g2c) {
    g2c.appendChild(sg);
  } else if (!isGrupal && sg && blk1c) {
    blk1c.appendChild(sg);
  }

  // Sync g2 header
  const cod = document.getElementById('cod-a')?.textContent || '—';
  const und = document.querySelector('[data-key="unidad"]')?.textContent || '—';
  const grp = document.querySelector('[data-key="hdr-grupo"]')?.textContent || '—';
  const nom = document.getElementById('hdr-nombre-act')?.innerHTML || '';
  const elList = [
    ['cod-g2', cod], ['und-g2', und], ['grp-g2', grp]
  ];
  elList.forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val; });
  const g2n = document.getElementById('g2-nombre'); if (g2n) g2n.innerHTML = nom;
  // logos synced globally via applyLogo on load; re-apply any custom overrides
  Object.entries(customLogos).forEach(([k, v]) => applyLogo(k, v));
}

function setComunidadGrupal(withComunidad) {
  const fw = document.getElementById('fichaWrap');
  if (withComunidad) fw.classList.add('grupal-con-comunidad');
  else fw.classList.remove('grupal-con-comunidad');
  localStorage.setItem(SF('grupal-comunidad'), withComunidad ? '1' : '0');
}

/* ── PÁGINAS EXTRA ── */
let extraPages = [];

function getExtraPageHeader() {
  const grupo = document.querySelector('[data-key="hdr-grupo"]')?.textContent || '';
  const unidad = document.querySelector('[data-key="unidad"]')?.textContent || '';
  const cod = document.getElementById('cod-a')?.textContent || '—';
  const nombre = document.getElementById('hdr-nombre-act')?.innerHTML || '';
  const logoG = document.getElementById('logo-grupo')?.src || '';
  const logoR = document.getElementById('logo-rama')?.src || '';
  return { grupo, unidad, cod, nombre, logoG, logoR };
}

function buildExtraPage(id, titulo, body) {
  const h = getExtraPageHeader();
  const currentTitle = document.getElementById('doc-title')?.textContent?.trim() || 'FICHA TÉCNICA';
  const wrap = document.createElement('div');
  wrap.className = 'extra-page-wrap';
  wrap.dataset.epId = id;
  wrap.innerHTML = `
        <button class="ep-del" onclick="removeExtraPage('${id}')" title="Eliminar página">✕</button>
        <div class="pg-div"></div>
        <div class="page-block">
          <div class="ficha-header">
            <div class="logo-slot" data-tip="Click para cambiar logo del grupo"><img class="zoom-logo ep-logo-g" src="${h.logoG}" alt=""><input type="file" accept="image/*" onchange="setLogo('logo-grupo',this)"></div>
            <div class="logo-slot logo-normal" data-tip="Click para cambiar logo de rama"><img class="ep-logo-r" src="${h.logoR}" alt=""><input type="file" accept="image/*" onchange="setLogo('logo-rama',this)"></div>
            <div class="logo-slot logo-grupal" data-tip="Click para cambiar logo Manada"><img src="images/rama-manada.jpg" alt="Manada" data-logo-key="rama-manada"><input type="file" accept="image/*" onchange="setLogo('rama-manada',this)"></div>
            <div class="logo-slot logo-grupal" data-tip="Click para cambiar logo Tropa"><img src="images/rama-tropa.jpg" alt="Tropa" data-logo-key="rama-tropa"><input type="file" accept="image/*" onchange="setLogo('rama-tropa',this)"></div>
            <div class="logo-slot logo-grupal logo-comunidad" data-tip="Click para cambiar logo Comunidad"><img src="images/rama-comunidad.jpg" alt="Comunidad" data-logo-key="rama-comunidad"><input type="file" accept="image/*" onchange="setLogo('rama-comunidad',this)"></div>
            <div class="logo-slot logo-grupal logo-clan" data-tip="Click para cambiar logo Clan"><img src="images/rama-clan.jpg" alt="Clan" data-logo-key="rama-clan"><input type="file" accept="image/*" onchange="setLogo('rama-clan',this)"></div>
            <div class="hdr-center">
              <div class="hdr-title hdr-title-doc">${currentTitle}</div>
              <div class="hdr-line"></div>
              <div class="hdr-nombre ep-nombre">${h.nombre}</div>
            </div>
            <div class="cod-box">
              <div class="cr"><span class="cr-l">CÓDIGO</span><span class="cr-v ep-cod">${h.cod}</span></div>
              <div class="cr"><span class="cr-l">GRUPO</span><span class="cr-v ep-grupo">${h.grupo}</span></div>
              <div class="cr"><span class="cr-l">UNIDAD</span><span class="cr-v ep-und">${h.unidad}</span></div>
            </div>
          </div>
          <div class="ambientacion-bar" style="opacity:0;pointer-events:none;padding:3px 0;"></div>
          <div class="page-content">
            <div style="padding:18px 0 0;">
              <div class="ep-titulo" contenteditable="false" data-ph="Título de la página...">${titulo}</div>
              <div class="ep-body"  contenteditable="false" data-ph="Escribe aquí texto libre...">${body}</div>
            </div>
          </div>
        </div>`;

  // Save on input
  wrap.querySelector('.ep-titulo').addEventListener('input', () => saveExtraPages());
  wrap.querySelector('.ep-body').addEventListener('input', () => saveExtraPages());
  return wrap;
}

function addExtraPage(id, titulo, body) {
  id = id || ('ep-' + Date.now());
  titulo = titulo || '';
  body = body || '';
  const wrap = buildExtraPage(id, titulo, body);
  document.getElementById('extraPagesContainer').appendChild(wrap);
  extraPages.push(id);
  syncExtraEditable();
  fitAllHdrNombres();
  saveExtraPages();
  scalePages();
  st('Página extra añadida');
}

function removeExtraPage(id) {
  const el = document.querySelector(`.extra-page-wrap[data-ep-id="${id}"]`);
  if (el) el.remove();
  extraPages = extraPages.filter(x => x !== id);
  saveExtraPages();
  scalePages();
  st('Página eliminada');
}

/* ── AUTO-SPLIT DE PÁGINAS EXTRA ──
   Si el contenido de una página extra (ej: instrucciones de
   actividades) no cabe en una hoja, se corta la parte que sobra y
   se crea una página nueva CON el mismo header repetido — en vez de
   desbordarse o recortarse feo al imprimir. Corta siempre entre
   actividades (cada bloque empieza en un <h4>), nunca a mitad de una. */
function splitExtraPageIfNeeded(id, depth) {
  depth = depth || 0;
  if (depth > 6) return; // límite de seguridad contra loops
  const wrap = document.querySelector(`.extra-page-wrap[data-ep-id="${id}"]`);
  if (!wrap) return;
  const pageBlock = wrap.querySelector('.page-block');
  const body = wrap.querySelector('.ep-body');
  if (!pageBlock || !body) return;

  const maxH = 11 * 96; // 11in en px CSS (96px/in)
  if (pageBlock.scrollHeight <= maxH + 2) return; // cabe, nada que hacer

  // Si el body envuelve todo en un único <div>, trabajar sobre sus hijos
  const root = (body.children.length === 1 && body.children[0].tagName === 'DIV')
    ? body.children[0] : body;
  const items = Array.from(root.children);
  if (items.length < 2) return; // nada que partir sin cortar contenido

  // Agrupar por actividad: cada grupo arranca en un <h4>
  const groups = [];
  items.forEach(el => {
    if (el.tagName === 'H4' || !groups.length) groups.push([]);
    groups[groups.length - 1].push(el);
  });
  if (groups.length < 2) return;

  const nonBodyH = pageBlock.scrollHeight - body.scrollHeight;
  const bodyMaxH = maxH - nonBodyH;

  let acc = 0, splitAt = -1;
  for (let i = 0; i < groups.length; i++) {
    const gH = groups[i].reduce((s, el) => s + el.offsetHeight, 0);
    if (i > 0 && acc + gH > bodyMaxH) { splitAt = i; break; }
    acc += gH;
  }
  if (splitAt < 1) return; // no hay forma de partir sin dejar la primera hoja vacía

  const moved = groups.slice(splitAt).flat();
  if (!moved.length) return;

  const wrapperStyle = (root !== body) ? root.getAttribute('style') : null;
  const tmp = document.createElement('div');
  moved.forEach(el => tmp.appendChild(el)); // los saca del DOM original
  const movedHTML = tmp.innerHTML;
  const nextBodyHTML = wrapperStyle ? `<div style="${wrapperStyle}">${movedHTML}</div>` : movedHTML;

  const tituloEl = wrap.querySelector('.ep-titulo');
  const tituloBase = tituloEl ? tituloEl.innerHTML.replace(/\s*\(continuaci[oó]n\)\s*$/i, '') : '';
  const nextTitulo = tituloBase ? (tituloBase + ' (continuación)') : '';
  const nextId = id + '-c' + (depth + 1);

  const nextWrap = buildExtraPage(nextId, nextTitulo, nextBodyHTML);
  wrap.after(nextWrap);
  const idx = extraPages.indexOf(id);
  extraPages.splice(idx >= 0 ? idx + 1 : extraPages.length, 0, nextId);

  splitExtraPageIfNeeded(nextId, depth + 1); // por si la continuación TAMBIÉN se desborda
}

function autoSplitExtraPages() {
  const ids = Array.from(document.querySelectorAll('.extra-page-wrap')).map(w => w.dataset.epId);
  ids.forEach(id => splitExtraPageIfNeeded(id));
  saveExtraPages();
  scalePages();
}

function syncExtraEditable() {
  const editable = editMode ? 'true' : 'false';
  document.querySelectorAll('.ep-titulo, .ep-body').forEach(el => el.contentEditable = editable);
}

function saveExtraPages() {
  const data = [];
  document.querySelectorAll('.extra-page-wrap').forEach(wrap => {
    data.push({
      id: wrap.dataset.epId,
      titulo: wrap.querySelector('.ep-titulo').innerHTML,
      body: wrap.querySelector('.ep-body').innerHTML,
    });
  });
  localStorage.setItem(SF('extra-pages'), JSON.stringify(data));
}

function loadExtraPages() {
  const raw = localStorage.getItem(SF('extra-pages'));
  if (!raw) return;
  try {
    JSON.parse(raw).forEach(p => addExtraPage(p.id, p.titulo, p.body));
    autoSplitExtraPages();
  } catch (e) { }
}

function syncExtraHeaders() {
  const h = getExtraPageHeader();
  document.querySelectorAll('.extra-page-wrap').forEach(wrap => {
    const lg = wrap.querySelector('.ep-logo-g'); if (lg) lg.src = h.logoG;
    const lr = wrap.querySelector('.ep-logo-r'); if (lr) lr.src = h.logoR;
    const nm = wrap.querySelector('.ep-nombre'); if (nm) nm.innerHTML = h.nombre;
    wrap.querySelectorAll('.ep-cod').forEach(el => el.textContent = h.cod);
    wrap.querySelectorAll('.ep-grupo').forEach(el => el.textContent = h.grupo);
    wrap.querySelectorAll('.ep-und').forEach(el => el.textContent = h.unidad);
  });
}
