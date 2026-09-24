/* programa-panel.js — Vista «Programa» del panel derecho: los momentos como tarjetas editables, agrupados por día cuando la
   ficha tiene varios días. Cada cambio se ve al instante en la tabla de la ficha y se guarda solo. Cada día tiene su hora
   de inicio (día 1 = hora de inicio de la ficha) y la hora de cada momento se calcula desde el anterior de ese día.
   Reemplaza al modal mProg y al botón «Separar día». Scripts clásicos: comparten el ámbito global. */

const $pl = () => document.getElementById('progLista');
let progTimer = null;

// La descripción se guarda como HTML (así la guarda la tabla editable); en la tarjeta se edita como texto
function descATexto(html) {
  const t = document.createElement('div');
  t.innerHTML = (html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p)>/gi, '\n');
  return t.textContent.replace(/\n+$/, '');
}
function textoADesc(txt) { return escHTML(txt).replace(/\n/g, '<br>'); }

function progTieneTexto(r) { return ['dur', 'act', 'desc', 'mat', 'resp'].some(k => (r[k] || '').replace(/<[^>]*>/g, '').trim()); }

/* ── Dibujar la lista ── */
function progRender() {
  const lista = $pl(); if (!lista) return;
  const n = numDias(), dias = getDays(), horas = horasProg();
  const opcionesDia = sel => dias.map((d, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>Día ${i + 1}</option>`).join('');
  let html = `<div class="pl-resumen">${progRows.length} momento${progRows.length === 1 ? '' : 's'}${n > 1 ? ` · ${n} días` : ''}</div>`;
  for (let d = 0; d < n; d++) {
    const etiqueta = n > 1 ? escHTML(dias[d].label) : 'Programa';
    html += `<div class="pl-dia" data-dia="${d}">
      <span class="pl-dia-lbl">${etiqueta}</span>
      <label class="pl-dia-hora">Empieza <input type="time" data-dia-hora="${d}" value="${horaDia(d)}"></label>
    </div>`;
    const idxs = progRows.map((r, i) => i).filter(i => diaDe(progRows[i]) === d);
    idxs.forEach((i, pos) => {
      const r = progRows[i];
      html += `<div class="pc" data-i="${i}">
        <div class="pc-top">
          <span class="pc-grip" title="Arrastrar para mover" aria-hidden="true">⠿</span>
          <span class="pc-hora">${horas[i] || ''}</span>
          <input class="pc-dur" data-f="dur" placeholder="Duración (ej. 15 min)" aria-label="Duración">
          ${n > 1 ? `<select class="pc-dia" data-f="dia" aria-label="Día">${opcionesDia(d)}</select>` : ''}
          <span class="pc-acc">
            <button type="button" data-acc="subir" title="Subir"${pos === 0 ? ' disabled' : ''}>↑</button>
            <button type="button" data-acc="bajar" title="Bajar"${pos === idxs.length - 1 ? ' disabled' : ''}>↓</button>
            <button type="button" data-acc="borrar" title="Borrar momento" class="pc-del">🗑</button>
          </span>
        </div>
        <input class="pc-act" data-f="act" placeholder="Actividad" aria-label="Actividad">
        <textarea class="pc-desc" data-f="desc" placeholder="Descripción" rows="2" aria-label="Descripción"></textarea>
        <div class="pc-row">
          <input data-f="mat" placeholder="Materiales" aria-label="Materiales">
          <input data-f="resp" placeholder="Responsable" aria-label="Responsable">
        </div>
      </div>`;
    });
    html += `<button type="button" class="pl-add" data-add-dia="${d}">+ Agregar momento${n > 1 ? ' al día ' + (d + 1) : ''}</button>`;
  }
  lista.innerHTML = html;
  // Valores por propiedad (no por HTML) para no interpretar lo que escribió el usuario
  lista.querySelectorAll('.pc').forEach(card => {
    const r = progRows[+card.dataset.i];
    card.querySelectorAll('[data-f]').forEach(el => {
      if (el.dataset.f === 'dia') return;
      el.value = el.dataset.f === 'desc' ? descATexto(r.desc) : (r[el.dataset.f] || '');
    });
    autoAlto(card.querySelector('.pc-desc'));
  });
}

function autoAlto(ta) { ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight, 44) + 'px'; }

function progActualizarHoras() {
  const horas = horasProg();
  $pl()?.querySelectorAll('.pc').forEach(card => { card.querySelector('.pc-hora').textContent = horas[+card.dataset.i] || ''; });
}

/* ── Aplicar a la ficha ── */
function progAplicar() {
  renderProg(); enableProgEdit(editMode); syncSec(); saveStorage();
  progActualizarHoras();
  st('✅ Programa guardado');
}
function progAplicarLuego() { clearTimeout(progTimer); progTimer = setTimeout(progAplicar, 250); }

// La tabla de la ficha (modo edición, arrastrar) avisa aquí para que las tarjetas no queden viejas
function progPanelRefrescar() {
  if (panelVista() !== 'programa') return;
  if ($pl().contains(document.activeElement)) { progActualizarHoras(); return; }
  progRender();
}

function progAgregar(dia) {
  const r = { dur: '', act: '', desc: '', mat: '', resp: '' };
  if (dia > 0) r.dia = dia;
  // Queda después del último momento de ese día
  let pos = progRows.length;
  for (let i = progRows.length - 1; i >= 0; i--) { if (diaDe(progRows[i]) === dia) { pos = i + 1; break; } }
  progRows.splice(pos, 0, r);
  progAplicar(); progRender();
  const card = $pl().querySelector(`.pc[data-i="${pos}"]`);
  if (card) { card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); card.querySelector('.pc-dur').focus(); }
}

// Al cerrar el panel se quitan los momentos agregados que quedaron sin nada escrito
function progLimpiarVacios() {
  const antes = progRows.length;
  progRows = progRows.filter(progTieneTexto);
  if (progRows.length !== antes) { renderProg(); enableProgEdit(editMode); syncSec(); saveStorage(); }
}

function progMover(i, paso) {
  const d = diaDe(progRows[i]);
  let j = i + paso;
  while (j >= 0 && j < progRows.length && diaDe(progRows[j]) !== d) j += paso;
  if (j < 0 || j >= progRows.length) return;
  [progRows[i], progRows[j]] = [progRows[j], progRows[i]];
  progAplicar(); progRender();
  $pl().querySelector(`.pc[data-i="${j}"] [data-acc="${paso < 0 ? 'subir' : 'bajar'}"]`)?.focus();
}

async function progBorrar(i) {
  const r = progRows[i];
  if (progTieneTexto(r)) {
    const nombre = (r.act || '').trim() || 'este momento';
    const ok = await dialogo({ titulo: '🗑 Borrar momento', texto: `¿Borrar «${nombre}» del programa?`, aceptar: 'Sí, borrar', cancelar: 'Cancelar', peligro: true });
    if (!ok) return;
  }
  progRows.splice(i, 1);
  progAplicar(); progRender();
}

// Mueve el momento `src` al día `dia`: antes/después de `ref`, o al final del día si no hay `ref`
function progMoverA(src, dia, ref, despues) {
  if (ref === src) return false;
  const [r] = progRows.splice(src, 1);
  if (dia) r.dia = dia; else delete r.dia;
  let pos = progRows.length;
  if (ref == null) {
    for (let i = progRows.length - 1; i >= 0; i--) { if (diaDe(progRows[i]) === dia) { pos = i + 1; break; } }
  } else {
    const k = ref > src ? ref - 1 : ref;
    pos = despues ? k + 1 : k;
  }
  progRows.splice(pos, 0, r);
  return true;
}

/* ── Arrastrar tarjetas (desde la manija ⠿) ── */
let progArrastre = null;
function progLimpiarMarcas() { $pl().querySelectorAll('.drop-antes, .drop-despues, .drop-dia').forEach(el => el.classList.remove('drop-antes', 'drop-despues', 'drop-dia')); }
function progDestino(e) {
  const card = e.target.closest('.pc'), dia = e.target.closest('.pl-dia'), add = e.target.closest('.pl-add');
  if (card) {
    const i = +card.dataset.i, r = card.getBoundingClientRect(), despues = e.clientY > r.top + r.height / 2;
    return { el: card, clase: despues ? 'drop-despues' : 'drop-antes', dia: diaDe(progRows[i]), ref: i, despues };
  }
  if (dia) {
    const d = +dia.dataset.dia, primero = progRows.findIndex(r => diaDe(r) === d);
    return { el: dia, clase: 'drop-dia', dia: d, ref: primero < 0 ? null : primero, despues: false };
  }
  if (add) return { el: add, clase: 'drop-dia', dia: +add.dataset.addDia, ref: null, despues: false };
  return null;
}

/* ── Abrir / cerrar ── */
function openProgramaPanel(agregar) {
  panelMostrar('programa');
  progRender();
  if (agregar) progAgregar(numDias() - 1);
}
function toggleProgramaPanel() {
  if (panelVista() === 'programa') closeConfigPanel(); else openProgramaPanel(!progRows.length);
}

/* ── Eventos (delegados en la lista) ── */
document.addEventListener('DOMContentLoaded', () => {
  const lista = $pl();
  lista.addEventListener('input', e => {
    const el = e.target, card = el.closest('.pc');
    if (el.dataset.diaHora !== undefined) return;
    if (!card || !el.dataset.f || el.dataset.f === 'dia') return;
    const r = progRows[+card.dataset.i];
    r[el.dataset.f] = el.dataset.f === 'desc' ? textoADesc(el.value) : el.value;
    if (el.dataset.f === 'desc') autoAlto(el);
    progAplicarLuego();
  });
  lista.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.diaHora !== undefined) {
      const d = +el.dataset.diaHora, v = el.value; if (!v) return;
      if (d === 0) {
        horaIniDia1 = v;
        document.querySelectorAll('[data-key="hora-inicio"]').forEach(x => x.textContent = v);
      } else horasDia[d] = v;
      progAplicar();
      return;
    }
    if (el.dataset.f === 'dia') {
      const r = progRows[+el.closest('.pc').dataset.i], d = +el.value;
      if (d) r.dia = d; else delete r.dia;
      progAplicar(); progRender();
    }
  });
  lista.addEventListener('mousedown', e => {
    const grip = e.target.closest('.pc-grip');
    if (grip) grip.closest('.pc').draggable = true;
  });
  lista.addEventListener('dragstart', e => {
    const card = e.target.closest('.pc'); if (!card) return;
    progArrastre = +card.dataset.i;
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', '');
    requestAnimationFrame(() => card.classList.add('arrastrando'));
  });
  lista.addEventListener('dragover', e => {
    if (progArrastre === null) return;
    const dest = progDestino(e); if (!dest) return;
    e.preventDefault(); progLimpiarMarcas(); dest.el.classList.add(dest.clase);
  });
  lista.addEventListener('drop', e => {
    if (progArrastre === null) return;
    const dest = progDestino(e); e.preventDefault();
    const src = progArrastre; progArrastre = null;
    if (dest && progMoverA(src, dest.dia, dest.ref, dest.despues)) { progAplicar(); progRender(); }
    else progRender();
  });
  lista.addEventListener('dragend', e => {
    progArrastre = null; progLimpiarMarcas();
    const card = e.target.closest('.pc'); if (card) { card.draggable = false; card.classList.remove('arrastrando'); }
  });
  lista.addEventListener('click', e => {
    const add = e.target.closest('[data-add-dia]');
    if (add) { progAgregar(+add.dataset.addDia); return; }
    const btn = e.target.closest('[data-acc]'); if (!btn) return;
    const i = +btn.closest('.pc').dataset.i;
    if (btn.dataset.acc === 'subir') progMover(i, -1);
    else if (btn.dataset.acc === 'bajar') progMover(i, 1);
    else progBorrar(i);
  });
});
