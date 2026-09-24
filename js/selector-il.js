/* selector-il.js — Paso P6 (docs/00-PLAN.md): mejoras del modal de Indicadores de Logro sobre el panel que dibuja
   renderIndPanel(): buscador sin acentos, filtros combinables por área y etapa, contador, chips de lo seleccionado
   (se quitan con un clic) y marca «en la ficha» en los que ya están agregados. No cambia los textos de INDICADORES.
   Scripts clásicos: comparten el ámbito global. */

const ilNorm = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const $il = id => document.getElementById(id);

function ilItems() { return [...document.querySelectorAll('#ind-panel .ind-item')]; }

// Se llama al final de renderIndPanel (abrir el modal o cambiar de rama)
function ilPreparar() {
  const data = INDICADORES[$il('ind-rama').value] || {};
  const areaAntes = $il('il-area').value, etapaAntes = $il('il-etapa').value;
  const areas = Object.keys(data);
  const etapas = [...new Set(Object.values(data).flatMap(e => Object.keys(e)))].sort();
  $il('il-area').innerHTML = '<option value="">Todas</option>' + areas.map(a => `<option>${escHTML(a)}</option>`).join('');
  $il('il-etapa').innerHTML = '<option value="">Todas</option>' + etapas.map(e => `<option>${escHTML(e)}</option>`).join('');
  if (areas.includes(areaAntes)) $il('il-area').value = areaAntes;
  if (etapas.includes(etapaAntes)) $il('il-etapa').value = etapaAntes;
  const enFicha = new Set(indRows.map(r => r.texto));
  ilItems().forEach(item => {
    const chk = item.querySelector('input');
    item.dataset.busca = ilNorm(chk.dataset.area + ' ' + chk.dataset.texto);
    if (enFicha.has(chk.dataset.texto)) {
      item.classList.add('en-ficha');
      const tag = document.createElement('span'); tag.className = 'il-tag'; tag.textContent = 'en la ficha';
      item.appendChild(tag);
    }
  });
  document.querySelectorAll('#ind-panel .ind-grp-title').forEach(t => {
    const n = t.nextElementSibling.querySelectorAll('.ind-item').length;
    const c = document.createElement('small'); c.className = 'il-grp-n'; t.insertBefore(c, t.querySelector('span'));
    c.dataset.total = n;
  });
  ilFiltrar();
}

function ilFiltrar() {
  const q = ilNorm($il('il-buscar').value.trim()), area = $il('il-area').value, etapa = $il('il-etapa').value;
  const filtrando = !!(q || area || etapa);
  const palabras = q.split(/\s+/).filter(Boolean);
  let visibles = 0;
  ilItems().forEach(item => {
    const chk = item.querySelector('input');
    const ok = (!area || chk.dataset.area === area) && (!etapa || chk.dataset.etapa === etapa) && palabras.every(p => item.dataset.busca.includes(p));
    item.hidden = !ok; if (ok) visibles++;
  });
  document.querySelectorAll('#ind-panel .ind-grp').forEach(grp => {
    const items = grp.querySelector('.ind-items'), n = items.querySelectorAll('.ind-item:not([hidden])').length;
    grp.hidden = filtrando && !n;
    const c = grp.querySelector('.il-grp-n'); if (c) c.textContent = filtrando ? `${n} de ${c.dataset.total}` : c.dataset.total;
    if (filtrando && n) { items.classList.add('open'); grp.querySelector('.ind-grp-title > span').textContent = '▼'; grp.querySelector('.ind-grp-title').setAttribute('aria-expanded', 'true'); }
  });
  $il('il-limpiar').hidden = !filtrando;
  const vacio = $il('il-sin-resultados');
  if (filtrando && !visibles) {
    if (!vacio) $il('ind-panel').insertAdjacentHTML('beforeend', '<p class="il-vacio" id="il-sin-resultados">Ningún indicador coincide con la búsqueda y los filtros.</p>');
  } else vacio?.remove();
  ilContar();
}

function ilContar() {
  const sel = [...document.querySelectorAll('#ind-panel input:checked')];
  const total = ilItems().length, vis = ilItems().filter(i => !i.hidden).length;
  $il('il-contador').textContent = `${sel.length} seleccionado${sel.length === 1 ? '' : 's'}` + (total ? ` · ${vis} de ${total} visibles` : '');
  $il('il-chips').innerHTML = sel.map((chk, i) => {
    const corto = chk.dataset.texto.length > 48 ? chk.dataset.texto.slice(0, 46) + '…' : chk.dataset.texto;
    return `<button type="button" class="il-chip" data-n="${i}" title="Quitar: ${escHTML(chk.dataset.texto)}"><b>${escHTML(chk.dataset.etapa)}</b> ${escHTML(corto)} <span aria-hidden="true">✕</span></button>`;
  }).join('');
  $il('il-chips').hidden = !sel.length;
}

document.addEventListener('DOMContentLoaded', () => {
  let t = null;
  $il('il-buscar').addEventListener('input', () => { clearTimeout(t); t = setTimeout(ilFiltrar, 120); });
  $il('il-area').addEventListener('change', ilFiltrar);
  $il('il-etapa').addEventListener('change', ilFiltrar);
  $il('il-limpiar').addEventListener('click', () => { $il('il-buscar').value = ''; $il('il-area').value = ''; $il('il-etapa').value = ''; ilFiltrar(); });
  $il('ind-panel').addEventListener('change', e => { if (e.target.matches('input[type=checkbox]')) ilContar(); });
  $il('il-chips').addEventListener('click', e => {
    const chip = e.target.closest('.il-chip'); if (!chip) return;
    const chk = [...document.querySelectorAll('#ind-panel input:checked')][+chip.dataset.n];
    if (chk) chk.checked = false;
    ilContar();
  });
});
