/* biblioteca-ficha.js — Paso P8 (docs/00-PLAN.md), lado de la Ficha: «💾 Guardar en mi biblioteca» y abrir un programa
   que llega desde programas.html (index.html?abrir=local:<id> o ?abrir=repo:<ruta del JSON>).
   La ficha recuerda de qué elemento de la biblioteca vino (sf_biblio_id) para actualizarlo en vez de duplicarlo;
   «Restablecer» borra ese vínculo junto con el resto de sf_*. Scripts clásicos: comparten el ámbito global. */

const BIB_VINCULO = SF('biblio_id');

function guardarEnBiblioteca(silencioso) {
  try {
    const item = bibGuardar(buildExportData(), localStorage.getItem(BIB_VINCULO));
    localStorage.setItem(BIB_VINCULO, item.id);
    if (!silencioso) {
      const u = bibUso();
      st('💾 Guardado en tu biblioteca');
      if (u.cerca) aviso(`Tu biblioteca usa ${bibMB(u.bytes)} de ~${bibMB(u.limite)} disponibles en este navegador. Exporta tu biblioteca desde Programas y borra los programas que ya no uses.`, '⚠️ Queda poco espacio');
    }
    return true;
  } catch (e) {
    if (!silencioso) aviso(e.lleno ? 'No hay espacio en este navegador para guardar otro programa. Tu ficha sigue intacta: exporta tu biblioteca desde Programas y borra los programas viejos.' : 'No se pudo guardar: ' + e.message, '💾 No se guardó');
    return false;
  }
}

async function abrirDesdeURL() {
  const p = new URLSearchParams(location.search).get('abrir'); if (!p) return;
  history.replaceState(null, '', location.pathname);
  const [fuente, ...resto] = p.split(':'); const ref = resto.join(':');
  let datos, item = null;
  try {
    if (fuente === 'local') { item = bibObtener(ref); if (!item) throw new Error('ese programa ya no está en tu biblioteca'); datos = item.datos; }
    else if (fuente === 'repo' && /^programas\/[\w\-/]+\.json$/.test(ref)) {
      const r = await fetch(ref); if (!r.ok) throw new Error('no se encontró ' + ref);
      datos = await r.json();
    } else throw new Error('enlace no válido');
  } catch (e) { aviso('No se pudo abrir el programa: ' + e.message, '📚 Abrir programa'); return; }

  const titulo = bibResumen(datos).titulo;
  const vinculado = localStorage.getItem(BIB_VINCULO);
  const esLaMisma = item && vinculado === item.id;
  if (fichaTieneContenido() && !esLaMisma) {
    const actual = (document.getElementById('hdr-nombre-act')?.textContent || '').trim() || 'sin nombre';
    const guardada = guardarEnBiblioteca(true);
    const ok = await dialogo({
      titulo: '📚 Abrir «' + titulo + '»',
      html: guardada
        ? `<p>Tu ficha actual («${escHTML(actual)}») se guardó en tu biblioteca y se reemplazará por este programa.</p>`
        : `<p><b>No se pudo guardar tu ficha actual</b> («${escHTML(actual)}») en la biblioteca: el navegador no tiene espacio.</p><p>Si abres este programa, la ficha actual se perderá. Cancela y expórtala primero si la necesitas.</p>`,
      aceptar: 'Abrir', cancelar: 'Cancelar', peligro: !guardada,
    });
    if (!ok) return;
  }
  if (editMode) toggleEdit();
  limpiarFicha();
  importarDatos(datos, '📚 Programa abierto');
  // Programas del repo se abren como copia nueva: al guardarlos van a «Mi biblioteca», no se tocan los del grupo
  if (item) localStorage.setItem(BIB_VINCULO, item.id); else localStorage.removeItem(BIB_VINCULO);
}

// Después de que principal.js cargó la ficha guardada (DOMContentLoaded)
window.addEventListener('load', abrirDesdeURL);
