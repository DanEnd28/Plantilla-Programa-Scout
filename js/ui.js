/* ui.js — UI: abrir/cerrar modales, estado de la barra (st), Escape, barra lateral retráctil, menú ⋯,
   hoja "Más" móvil y escalado de páginas en pantallas chicas.
   Extraído de index.html en el paso P1, extendido en el paso P2 (docs/00-PLAN.md). Scripts clásicos: comparten el ámbito global. */

/* ─── PDF / HELPERS ─── */

// Al abrir un modal el foco entra en él; al cerrarlo vuelve a lo que lo abrió (teclado y lector de pantalla)
const focoPrevio = {};
function openM(id) {
  const m = document.getElementById(id);
  focoPrevio[id] = document.activeElement;
  m.classList.add('open');
  if (id === 'mInd') renderIndPanel();
  const primero = m.querySelector('[data-foco-inicial]') || m.querySelector('input:not([type=file]):not([type=checkbox]), select, textarea, .modal-x');
  setTimeout(() => primero?.focus(), 30);
}
function closeM(id) {
  const m = document.getElementById(id);
  if (!m.classList.contains('open')) return;
  m.classList.remove('open');
  const volver = focoPrevio[id]; delete focoPrevio[id];
  if (volver && document.contains(volver) && volver.offsetParent !== null) volver.focus();
}
function scrollHelp() { document.getElementById('helpPage').scrollIntoView({ behavior: 'smooth' }); }
function st(msg) { const el = document.getElementById('tbSt'); el.textContent = msg; el.style.color = '#a8f0a8'; setTimeout(() => { el.textContent = 'Listo'; el.style.color = ''; }, 2500); }
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.overlay.open').forEach(m => closeM(m.id));
  closeMoreMenu(); closeBottomSheet(); closeConfigPanel();
});

/* ── BARRA LATERAL (escritorio): colapsar/expandir, recordado en localStorage ──
   Clave fuera del prefijo sf_ a propósito: "Restablecer" (doReset) borra sf_* y esto es
   preferencia de interfaz, no dato de la ficha. */
const UI_SIDEBAR_KEY = 'ui_barra_colapsada';
function applySidebarState(colapsada) {
  document.body.classList.toggle('sidebar-colapsada', colapsada);
  const btn = document.getElementById('sideCollapseBtn');
  if (btn) { btn.title = colapsada ? 'Expandir barra' : 'Contraer barra'; btn.setAttribute('aria-expanded', !colapsada); btn.setAttribute('aria-label', colapsada ? 'Expandir menú' : 'Contraer menú'); }
}
function toggleSidebar() {
  const colapsada = !document.body.classList.contains('sidebar-colapsada');
  applySidebarState(colapsada);
  localStorage.setItem(UI_SIDEBAR_KEY, colapsada ? '1' : '0');
  scalePages();
}
applySidebarState(localStorage.getItem(UI_SIDEBAR_KEY) === '1');

/* ── MENÚ ⋯ (barra superior) ── */
function toggleMoreMenu() {
  const abierto = document.getElementById('tbMoreMenu').classList.toggle('open');
  document.getElementById('tbMoreBtn').setAttribute('aria-expanded', abierto);
  if (abierto) document.querySelector('#tbMoreMenu button')?.focus();
}
function closeMoreMenu() { document.getElementById('tbMoreMenu')?.classList.remove('open'); document.getElementById('tbMoreBtn')?.setAttribute('aria-expanded', 'false'); }
document.addEventListener('click', e => {
  if (!e.target.closest('.tb-more')) closeMoreMenu();
});

/* ── HOJA "MÁS" (móvil) ── */
function toggleBottomSheet() {
  const abierto = document.getElementById('bottomSheet').classList.toggle('open');
  document.getElementById('bottomSheetBackdrop').classList.toggle('open', abierto);
  document.getElementById('bbMoreBtn').setAttribute('aria-expanded', abierto);
  if (abierto) setTimeout(() => document.querySelector('#bottomSheet .bs-item')?.focus(), 30);
}
function closeBottomSheet() {
  document.getElementById('bottomSheet')?.classList.remove('open');
  document.getElementById('bottomSheetBackdrop')?.classList.remove('open');
  document.getElementById('bbMoreBtn')?.setAttribute('aria-expanded', 'false');
}

// Page scaling for small screens
function scalePages() {
  const wrap = document.querySelector('.pages-wrap');
  if (!wrap) return;
  const blocks = document.querySelectorAll('.page-block');
  if (!blocks.length) return;
  wrap.style.zoom = ''; wrap.style.marginLeft = ''; wrap.style.marginRight = ''; wrap.style.paddingTop = ''; wrap.style.paddingBottom = '';
  const naturalW = blocks[0].getBoundingClientRect().width || 816;
  const css = getComputedStyle(document.documentElement);
  const visible = id => { const el = document.getElementById(id); return el && getComputedStyle(el).display !== 'none'; };
  const sideW = visible('sidebar') ? parseFloat(css.getPropertyValue(document.body.classList.contains('sidebar-colapsada') ? '--sidebar-w-collapsed' : '--sidebar-w')) : 0;
  // El panel de configuración solo empuja la ficha en escritorio (en móvil la cubre)
  const panelW = sideW && document.body.classList.contains('cfg-abierto') ? parseFloat(css.getPropertyValue('--cfg-w')) : 0;
  const avail = window.innerWidth - sideW - panelW;
  if (avail >= naturalW + 24) return;
  const z = avail / naturalW;
  // zoom también encoge márgenes y rellenos: se compensan para que la ficha no quede bajo el header ni la barra lateral
  wrap.style.zoom = z.toFixed(4);
  wrap.style.marginLeft = (sideW / z) + 'px';
  if (panelW) wrap.style.marginRight = (panelW / z) + 'px';
  wrap.style.paddingTop = (parseFloat(css.getPropertyValue('--topbar-h')) / z) + 'px';
  if (visible('bottombar')) wrap.style.paddingBottom = (parseFloat(css.getPropertyValue('--bottombar-h')) / z) + 'px';
}
window.addEventListener('resize', scalePages);
window.addEventListener('load', scalePages);
