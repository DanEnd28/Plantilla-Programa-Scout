/* accesibilidad.js — Paso P10 (docs/00-PLAN.md): lo que la ficha necesita para usarse con teclado y lector de pantalla,
   aplicado sobre el HTML y sobre lo que se dibuja después (ODS, I.L., páginas extra) sin tocar la lógica de la ficha:
   nombres para los selectores de logo y los campos editables, teclado (Enter/Espacio) en elementos con role="button",
   íconos decorativos ocultos al lector y el foco atrapado dentro del modal abierto. Scripts clásicos. */

const A11Y_CAMPOS = {
  'hdr-nombre-act': 'Nombre de la actividad', 'hdr-ambientacion': 'Ambientación', 'doc-title': 'Título del documento',
};

function a11yEtiquetar(raiz = document) {
  // Selectores de logo (input file invisible sobre la imagen): el nombre sale de su data-tip
  raiz.querySelectorAll('.logo-slot input[type=file]:not([aria-label])').forEach(inp => {
    const tip = inp.closest('[data-tip]')?.dataset.tip || 'Cambiar logo';
    inp.setAttribute('aria-label', tip.replace(/^Click para /i, '').replace(/^./, c => c.toUpperCase()));
  });
  // Campos editables de la ficha: rol de cuadro de texto con nombre (placeholder o etiqueta vecina)
  raiz.querySelectorAll('[data-edit="true"]:not([role]), #hdr-nombre-act:not([role]), #hdr-ambientacion:not([role]), .ep-body:not([role]), .ep-titulo:not([role])').forEach(el => {
    const titEP = el.closest('.extra-page-wrap')?.querySelector('.ep-titulo')?.textContent.trim();
    const etiqueta = A11Y_CAMPOS[el.id]
      || (el.matches('.ep-body') && 'Contenido de ' + (titEP || 'la página extra'))
      || (el.matches('.ep-titulo') && 'Título de la página extra')
      || el.closest('.sec')?.querySelector('.sec-head')?.firstChild?.textContent.trim().replace(/^\W+/, '')
      || el.closest('.info-sec-item')?.querySelector('.info-sec-lbl')?.textContent.trim()
      || el.closest('.cr')?.querySelector('.cr-l')?.textContent.trim()
      || el.dataset.ph || 'Texto';
    el.setAttribute('role', 'textbox');
    el.setAttribute('aria-label', etiqueta.charAt(0) + etiqueta.slice(1).toLowerCase());
    if (el.matches('.sec-body, .ep-body')) el.setAttribute('aria-multiline', 'true');
  });
  a11ySoloLectura(raiz);
  // Íconos de la barra lateral e inferior: decorativos (el nombre está en el texto)
  raiz.querySelectorAll('.nav-ico:not([aria-hidden]), .ods-ico:not([aria-hidden])').forEach(el => el.setAttribute('aria-hidden', 'true'));
}

// Fuera del modo edición los campos se anuncian como de solo lectura
function a11ySoloLectura(raiz = document) {
  raiz.querySelectorAll('[role="textbox"]').forEach(el => el.setAttribute('aria-readonly', !el.isContentEditable));
}

// Elementos que no son <button> pero actúan como botón (ODS, grupos de I.L.): Enter y Espacio los activan
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('[role="button"]:not(button):not(a)');
  if (!el || el.isContentEditable) return;
  e.preventDefault(); el.click();
});

// Foco atrapado dentro del modal abierto (Tab / Shift+Tab dan la vuelta)
const A11Y_FOCO = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function a11yFocables(cont) { return [...cont.querySelectorAll(A11Y_FOCO)].filter(el => el.offsetParent !== null || el === document.activeElement); }
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const modal = [...document.querySelectorAll('.overlay.open')].pop(); if (!modal) return;
  const f = a11yFocables(modal); if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  else if (!modal.contains(document.activeElement)) { e.preventDefault(); f[0].focus(); }
});

document.addEventListener('DOMContentLoaded', () => {
  a11yEtiquetar();
  // Modales: rol de diálogo con título
  document.querySelectorAll('.overlay').forEach((ov, i) => {
    const titulo = ov.querySelector('.modal-title');
    if (titulo && !titulo.id) titulo.id = 'dlg-t-' + (ov.id || i);
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    if (titulo) ov.setAttribute('aria-labelledby', titulo.id);
    ov.querySelectorAll('.modal-x:not([aria-label])').forEach(x => x.setAttribute('aria-label', 'Cerrar'));
  });
  new MutationObserver(() => a11ySoloLectura()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // Lo que se dibuja después (páginas extra, ODS) también recibe nombres
  new MutationObserver(ms => { if (ms.some(m => m.addedNodes.length)) a11yEtiquetar(); })
    .observe(document.getElementById('fichaWrap'), { childList: true, subtree: true });
});
