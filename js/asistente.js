/* asistente.js — Paso P3 (docs/00-PLAN.md): asistente de inicio en 3 pasos (rama · fecha y lugar · unidad o grupal) y dos
   caminos al final: «Crear manual» o «Importar JSON de Tico». Aparece solo con la ficha vacía, se puede saltar y no vuelve a
   salir (clave ui_asistente_hecho, fuera de sf_* para que «Restablecer» no la borre); se reabre desde el menú.
   Lo elegido se aplica con la misma lógica del panel de Configuración (js/config-panel.js). Scripts clásicos. */

const AS_CLAVE = 'ui_asistente_hecho';
const AS_VIENE_DE_BIBLIOTECA = new URLSearchParams(location.search).has('abrir');
const $as = id => document.getElementById(id);
let asPaso = 1, asRama = null;

function asMostrarPaso() {
  document.querySelectorAll('#mAsistente .as-paso').forEach(s => s.hidden = +s.dataset.paso !== asPaso);
  document.querySelectorAll('#mAsistente .as-pasos li').forEach((li, i) => {
    li.classList.toggle('on', i + 1 === asPaso); li.classList.toggle('hecho', i + 1 < asPaso);
    li.toggleAttribute('aria-current', i + 1 === asPaso);
  });
  $as('asAtras').hidden = asPaso === 1;
  $as('asSig').hidden = asPaso === 4;
  asError('');
  // El foco va al título del paso (lo anuncia el lector de pantalla y no parece una opción elegida)
  const titulo = document.querySelector(`#mAsistente .as-paso[data-paso="${asPaso}"] h3`);
  titulo.tabIndex = -1; setTimeout(() => titulo.focus(), 40);
}

function asError(msg) {
  let el = $as('asError');
  if (!el) { el = document.createElement('p'); el.id = 'asError'; el.className = 'as-error'; el.setAttribute('role', 'alert'); document.querySelector('#mAsistente .as-pie').before(el); }
  el.textContent = msg; el.hidden = !msg;
}

function asElegirRama(rama) {
  asRama = rama;
  document.querySelectorAll('#mAsistente .as-rama').forEach(b => b.setAttribute('aria-pressed', b.dataset.rama === rama));
  $as('as-nom-rama').textContent = rama;
}

function asIr(paso) {
  if (paso > 0) {
    if (asPaso === 1 && !asRama) return asError('Elige una rama para seguir.');
    if (asPaso === 2) {
      const fi = $as('as-fi').value, ff = $as('as-ff').value;
      if (!fi) return asError('Indica la fecha de inicio (con ella se arma el código de la ficha).');
      if (ff && ff < fi) return asError('La fecha de fin no puede ser anterior a la de inicio.');
    }
  }
  asPaso = Math.min(4, Math.max(1, asPaso + paso));
  asMostrarPaso();
}

// Lleva lo elegido a la ficha usando los campos y funciones del panel de Configuración
function asAplicar() {
  cfgRellenar();
  const grupal = document.querySelector('input[name="as-tipo"]:checked').value === 'grupal';
  const fi = $as('as-fi').value, ff = $as('as-ff').value || fi;
  $as('cfg-rama').value = grupal ? 'Grupal' : asRama;
  $as('cfg-grupal-comunidad').checked = grupal && $as('as-comunidad').checked;
  $as('cfg-fecha-ini').value = fi; $as('cfg-fecha-fin').value = ff;
  fechaFin = ff; // si antes era de varios días y ahora es de uno, que no quede la fecha vieja
  $as('cfg-hi').value = $as('as-hi').value || '10:00';
  $as('cfg-hc').value = $as('as-hc').value || '13:00';
  if ($as('as-resp').value.trim()) $as('cfg-resp').value = $as('as-resp').value.trim();
  cfgAplicar(['cfg-rama', 'cfg-fecha-ini', 'cfg-hi', 'cfg-resp']);
  const lugar = $as('as-lugar').value.trim();
  if (lugar) { document.querySelectorAll('[data-key="lugar"]').forEach(el => el.textContent = lugar); saveStorage(); syncSec(); }
}

function asCerrar() { localStorage.setItem(AS_CLAVE, '1'); closeM('mAsistente'); }
function asSaltar() { asCerrar(); st('Puedes abrir el asistente cuando quieras desde el menú 🧭'); }
function asTerminar() {
  asAplicar(); asCerrar();
  st('✅ Ficha lista: completa las secciones');
  openIndicePanel();
}

function asAbrir() {
  asPaso = 1;
  // Si se reabre con datos, arranca con lo que ya tiene la ficha
  // Una ficha nueva arranca con ramaActual = 'manada' por defecto: solo se marca si la rama ya estaba guardada
  const ramaNom = localStorage.getItem(SF('rama')) ? { manada: 'Manada', tropa: 'Tropa', comunidad: 'Comunidad', clan: 'Clan' }[ramaActual] : null;
  asElegirRama(ramaNom || null);
  if (!ramaNom) document.querySelectorAll('#mAsistente .as-rama').forEach(b => b.setAttribute('aria-pressed', 'false'));
  $as('as-fi').value = fechaIni || ''; $as('as-ff').value = fechaFin && fechaFin !== fechaIni ? fechaFin : '';
  $as('as-hi').value = horaIniDia1 || '10:00'; $as('as-hc').value = horaCierreUltimo || '13:00';
  const lugar = (document.querySelector('[data-key="lugar"]')?.textContent || '').trim();
  if (lugar) $as('as-lugar').value = lugar;
  document.querySelector(`input[name="as-tipo"][value="${ramaActual === 'grupal' ? 'grupal' : 'unidad'}"]`).checked = true;
  document.querySelector('.as-comunidad').hidden = ramaActual !== 'grupal';
  openM('mAsistente');
  asMostrarPaso();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#mAsistente .as-rama').forEach(b => b.addEventListener('click', () => {
    asElegirRama(b.dataset.rama);
    setTimeout(() => asIr(1), 180); // elegir la rama ya avanza
  }));
  document.querySelectorAll('input[name="as-tipo"]').forEach(r => r.addEventListener('change', () => {
    document.querySelector('.as-comunidad').hidden = r.value !== 'grupal' || !r.checked;
  }));
  $as('as-json').addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    asAplicar(); asCerrar();
    doImportJSON(f); // lo que traiga el JSON de Tico reemplaza a lo elegido
  });
});

// Después de cargar la ficha guardada (principal.js) y de un posible «Abrir» desde la biblioteca
window.addEventListener('load', () => {
  if (AS_VIENE_DE_BIBLIOTECA || localStorage.getItem(AS_CLAVE) === '1') return;
  if (fichaTieneContenido() || progRows.length || indRows.length) return;
  asAbrir();
});
