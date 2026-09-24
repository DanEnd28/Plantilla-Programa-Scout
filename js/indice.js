/* indice.js — Paso P5 (docs/00-PLAN.md): índice de secciones con estado ✓ / ⚠ / vacío en el panel derecho (vista «indice»),
   contador en el header y un botón claro en cada sección vacía de la ficha. Se recalcula solo: un MutationObserver sobre
   la ficha avisa de cualquier cambio (texto, I.L., ODS, programa). También refresca los botones de exportar (P7).
   Scripts clásicos: comparten el ámbito global. */

const txtDe = sel => (document.querySelector(sel)?.textContent || '').trim();

// Pone la ficha en modo edición (si hace falta) y lleva el cursor al campo
function idxEditar(sel) {
  if (!editMode) toggleEdit();
  const el = document.querySelector(sel); if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => el.focus(), 250);
}

const IDX_SECCIONES = [
  { id: 'nombre', nombre: 'Nombre de la actividad', ir: '#hdr-nombre-act', accion: '+ Escribir nombre', hacer: () => idxEditar('#hdr-nombre-act'),
    estado: () => txtDe('#hdr-nombre-act') ? ['ok'] : ['vacio'] },
  { id: 'datos', nombre: 'Lugar y fecha', ir: '.info-sec-grid', accion: 'Completar', hacer: () => idxEditar(txtDe('[data-key="lugar"]') ? '[data-key="fecha"]' : '[data-key="lugar"]'),
    estado: () => {
      const faltan = [['lugar', 'lugar'], ['fecha', 'fecha']].filter(([k]) => !txtDe(`[data-key="${k}"]`)).map(([, n]) => n);
      return !faltan.length ? ['ok'] : faltan.length === 2 ? ['vacio'] : ['aviso', 'Falta ' + faltan[0]];
    } },
  { id: 'ambientacion', nombre: 'Ambientación', ir: '.ambientacion-bar', accion: '+ Escribir ambientación', hacer: () => idxEditar('#hdr-ambientacion'),
    estado: () => txtDe('#hdr-ambientacion') ? ['ok'] : ['vacio'] },
  { id: 'indicadores', nombre: 'Indicadores de logro', ir: '#ind-tbody', accion: '+ Elegir indicadores', hacer: () => openM('mInd'),
    estado: () => indRows.length ? ['ok', indRows.length + ' elegido' + (indRows.length === 1 ? '' : 's')] : ['vacio'] },
  { id: 'oportunidad', nombre: 'Oportunidad de aprendizaje', key: 'oportunidad', accion: '+ Escribir oportunidad' },
  { id: 'obj-general', nombre: 'Objetivo general', key: 'obj-general', accion: '+ Agregar objetivo general' },
  { id: 'obj-especificos', nombre: 'Objetivos específicos', key: 'obj-especificos', accion: '+ Agregar objetivos' },
  { id: 'ods', nombre: 'ODS relacionados', ir: '#ods-wrap', accion: '+ Elegir ODS', hacer: () => idxIr('#ods-wrap'),
    estado: () => odsActivos.size ? ['ok', odsActivos.size + ' elegido' + (odsActivos.size === 1 ? '' : 's')] : ['vacio'] },
  { id: 'prog-mundial', nombre: 'Programa mundial / iniciativas', key: 'prog-mundial', accion: '+ Escribir iniciativa' },
  { id: 'metas', nombre: 'Metas', key: 'metas', accion: '+ Agregar metas' },
  { id: 'enfoque', nombre: 'Enfoque de impacto', key: 'enfoque', accion: '+ Escribir enfoque' },
  { id: 'programa', nombre: 'Programa de la actividad', ir: '.prog-table', accion: '+ Agregar momento', hacer: () => openProgramaPanel(true),
    estado: () => {
      if (!progRows.length) return ['vacio'];
      const incompletos = progRows.filter(r => !(r.act || '').trim() || !parseMins(r.dur || '')).length;
      const n = progRows.length + ' momento' + (progRows.length === 1 ? '' : 's');
      return incompletos ? ['aviso', `${n} · ${incompletos} sin actividad o duración`] : ['ok', n];
    } },
];
// Las secciones de texto de la ficha comparten la misma lógica
IDX_SECCIONES.filter(s => s.key).forEach(s => {
  const sel = `.sec-body[data-key="${s.key}"]`;
  s.ir = sel; s.hacer = () => idxEditar(sel);
  s.estado = () => txtDe(sel) ? ['ok'] : ['vacio'];
});
// Opcionales = las que la propia ficha marca así (data-optional: vacías no se imprimen) y la ambientación.
// No cuentan para el progreso ni bloquean nada; vacías se muestran como «Opcional».
function idxEsOpcional(s) {
  if (s.id === 'ambientacion') return true;
  return !!(s.key && document.querySelector(s.ir)?.closest('.sec')?.dataset.optional === 'true');
}

function idxIr(sel) {
  const el = document.querySelector(sel); if (!el) return;
  const bloque = el.closest('.sec, .info-sec-grid, .ambientacion-bar, .ficha-header') || el;
  bloque.scrollIntoView({ behavior: 'smooth', block: 'center' });
  bloque.classList.remove('idx-flash'); void bloque.offsetWidth; bloque.classList.add('idx-flash');
}

const IDX_ICONO = { ok: '✓', aviso: '⚠', vacio: '', opcional: '○' };
const IDX_TEXTO = { ok: 'Completo', aviso: 'Incompleto', vacio: 'Vacío', opcional: 'Opcional' };

function idxCalcular() {
  return IDX_SECCIONES.map(s => {
    const [estado, detalle] = s.estado(), opcional = idxEsOpcional(s);
    return { ...s, opcional, estado_: opcional && estado === 'vacio' ? 'opcional' : estado, detalle: detalle || (opcional && estado === 'vacio' ? 'Opcional' : '') };
  });
}
// El progreso cuenta solo las obligatorias
function idxProgreso(lista) { const ob = lista.filter(s => !s.opcional); return { ok: ob.filter(s => s.estado_ === 'ok').length, total: ob.length }; }

function idxRender(lista) {
  const cont = document.getElementById('idxLista'); if (!cont) return;
  const { ok, total } = idxProgreso(lista);
  const fila = s => `<div class="idx-item ${s.estado_}" data-idx="${s.id}">
      <button type="button" class="idx-ir" data-ir="${s.id}" title="Ir a la sección">
        <span class="idx-est" aria-label="${IDX_TEXTO[s.estado_]}">${IDX_ICONO[s.estado_]}</span>
        <span class="idx-txt"><span class="idx-nom">${s.nombre}</span><span class="idx-det">${escHTML(s.detalle || IDX_TEXTO[s.estado_])}</span></span>
      </button>
      ${s.estado_ !== 'ok' ? `<button type="button" class="idx-accion" data-hacer="${s.id}">${s.accion}</button>` : ''}
    </div>`;
  cont.innerHTML = `<div class="idx-resumen"><div class="idx-barra"><span style="width:${Math.round(ok / total * 100)}%"></span></div>
    <b>${ok} de ${total}</b> secciones obligatorias completas</div>` +
    lista.filter(s => !s.opcional).map(fila).join('') +
    `<div class="idx-sub">Opcionales <span>— si quedan vacías no se imprimen y no impiden exportar</span></div>` +
    lista.filter(s => s.opcional).map(fila).join('');
}

// Botón claro dentro de cada sección de texto vacía (no se imprime; en modo edición lo reemplaza el placeholder)
function idxBotonesFicha(lista) {
  lista.filter(s => s.key).forEach(s => {
    const sec = document.querySelector(s.ir)?.closest('.sec'); if (!sec) return;
    let btn = sec.querySelector('.sec-cta');
    if (!btn) {
      btn = document.createElement('button'); btn.type = 'button'; btn.className = 'sec-cta'; btn.textContent = s.accion;
      btn.onclick = s.hacer; sec.appendChild(btn);
    }
    btn.hidden = !['vacio', 'opcional'].includes(s.estado_) || editMode;
  });
}

function idxActualizar() {
  const lista = idxCalcular();
  const { ok, total } = idxProgreso(lista);
  const t = document.getElementById('tbProgresoTxt'); if (t) t.textContent = `${ok}/${total}`;
  const b = document.getElementById('sideProgreso'); if (b) b.textContent = `${ok}/${total}`;
  document.getElementById('tbProgreso')?.classList.toggle('completo', ok === total);
  document.getElementById('tbProgreso')?.setAttribute('title', `${ok} de ${total} secciones obligatorias completas (las opcionales no cuentan)`);
  idxBotonesFicha(lista);
  if (panelVista() === 'indice' && !document.getElementById('idxLista').contains(document.activeElement)) idxRender(lista);
  if (typeof exportarActualizar === 'function') exportarActualizar();
}

let idxTimer = null;
function idxProgramar() { clearTimeout(idxTimer); idxTimer = setTimeout(idxActualizar, 200); }

function openIndicePanel() {
  if (panelVista() === 'programa') progLimpiarVacios();
  panelMostrar('indice');
  idxRender(idxCalcular());
}
function toggleIndicePanel() { if (panelVista() === 'indice') closeConfigPanel(); else openIndicePanel(); }

document.addEventListener('DOMContentLoaded', () => {
  const cont = document.getElementById('idxLista');
  cont.addEventListener('click', e => {
    const ir = e.target.closest('[data-ir]'), hacer = e.target.closest('[data-hacer]');
    const s = IDX_SECCIONES.find(x => x.id === (ir || hacer)?.dataset[ir ? 'ir' : 'hacer']);
    if (!s) return;
    if (ir) idxIr(s.ir); else s.hacer();
  });
  // Cualquier cambio en la ficha (escribir, I.L., ODS, programa, importar) recalcula el índice
  new MutationObserver(idxProgramar).observe(document.getElementById('fichaWrap'), { childList: true, subtree: true, characterData: true });
  // El modo edición cambia la clase del body: los botones de sección se esconden mientras se edita
  new MutationObserver(idxProgramar).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  idxActualizar();
});
