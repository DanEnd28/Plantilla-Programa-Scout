/* principal.js — Arranque: DOMContentLoaded (carga del estado y primer render) y autoguardado en modo edición. Va ÚLTIMO.
   Extraído de index.html en el paso P1 (docs/00-PLAN.md). Scripts clásicos: comparten el ámbito global. */

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', async () => {
  // ☁️ Si la URL trae ?id=..., js/nube.js baja el programa y lo deja en localStorage antes de cargar.
  if (window.nubePrecargar) { try { await window.nubePrecargar(); } catch (e) { console.warn('[nube]', e); } }
  loadStorage(); renderODS(); renderProg(); renderInd(); syncSec(); syncEmpty(); initDrag(); scalePages(); loadExtraPages();
  if (window.nubeIniciar) window.nubeIniciar();
});

setInterval(() => { if (editMode) saveStorage(); }, 45000);
