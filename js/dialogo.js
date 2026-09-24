/* ╔══════════════════════════════════════════════════════╗
   ║  💬 Diálogo propio (reemplaza alert/confirm nativos)  ║
   ╚══════════════════════════════════════════════════════╝
   await dialogo({ titulo, html | texto, aceptar: 'Sí', cancelar: 'No' | null,
                   peligro: true, palabra: 'BORRAR' })  → true / false
   - cancelar: null  → solo un botón (tipo alert).
   - palabra         → hay que escribirla para habilitar "aceptar" (borrados definitivos).
   Autocontenido: inyecta sus estilos y funciona en cualquier página. */
(function () {
  const CSS = `
  .dlg-ov{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;padding:16px;
    background:rgba(13,8,32,.72);backdrop-filter:blur(4px);animation:dlgIn .12s ease-out}
  .dlg{background:#fff;color:#2a2340;border-radius:14px;width:100%;max-width:440px;max-height:86vh;overflow:auto;
    box-shadow:0 24px 64px rgba(26,8,64,.55);font-family:'Noto Sans',sans-serif}
  .dlg-h{padding:16px 18px 6px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;color:#622599}
  .dlg.peligro .dlg-h{color:#B40D15}
  .dlg-b{padding:4px 18px 8px;font-size:13px;line-height:1.55;white-space:normal}
  .dlg-b p+p{margin-top:8px}
  .dlg-in{width:100%;margin-top:10px;padding:8px 10px;border:1.5px solid #c9a8e8;border-radius:8px;font-size:13px;
    font-family:inherit;outline:none}
  .dlg-in:focus{border-color:#622599}
  .dlg-f{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;padding:10px 18px 16px}
  .dlg-btn{font-family:'Montserrat',sans-serif;font-weight:700;font-size:12px;padding:8px 14px;border-radius:18px;
    border:1px solid #d6cce6;background:#f4effa;color:#3a1060;cursor:pointer}
  .dlg-btn:hover{filter:brightness(.96)}
  .dlg-ok{background:#622599;border-color:#622599;color:#fff}
  .dlg.peligro .dlg-ok{background:#B40D15;border-color:#B40D15}
  .dlg-ok:disabled{opacity:.45;cursor:not-allowed}
  @keyframes dlgIn{from{opacity:0}to{opacity:1}}`;
  let estilos = false;
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  window.dialogo = function (op = {}) {
    if (!estilos) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); estilos = true; }
    const { titulo = 'Confirmar', texto = '', html = null, aceptar = 'Aceptar', cancelar = 'Cancelar', peligro = false, palabra = null } = op;
    return new Promise(resolve => {
      const ov = document.createElement('div');
      ov.className = 'dlg-ov';
      const cuerpo = html ?? esc(texto).split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
      ov.innerHTML = `<div class="dlg${peligro ? ' peligro' : ''}" role="alertdialog" aria-modal="true" aria-labelledby="dlgT">
        <div class="dlg-h" id="dlgT">${esc(titulo)}</div>
        <div class="dlg-b">${cuerpo}${palabra ? `<p>Para confirmar escribe <b>${esc(palabra)}</b>:</p><input class="dlg-in" autocomplete="off" aria-label="Confirmación">` : ''}</div>
        <div class="dlg-f">${cancelar ? `<button type="button" class="dlg-btn dlg-no">${esc(cancelar)}</button>` : ''}
          <button type="button" class="dlg-btn dlg-ok"${palabra ? ' disabled' : ''}>${esc(aceptar)}</button></div></div>`;
      const previo = document.activeElement;
      const fin = v => { document.removeEventListener('keydown', tecla, true); ov.remove(); try { previo?.focus?.(); } catch { } resolve(v); };
      const ok = ov.querySelector('.dlg-ok'); const no = ov.querySelector('.dlg-no'); const inp = ov.querySelector('.dlg-in');
      const tecla = e => {
        if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); fin(false); }
        else if (e.key === 'Enter' && !ok.disabled && document.activeElement?.tagName !== 'BUTTON') { e.preventDefault(); fin(true); }
      };
      ok.onclick = () => fin(true);
      if (no) no.onclick = () => fin(false);
      ov.addEventListener('click', e => { if (e.target === ov) fin(false); });
      if (inp) inp.oninput = () => { ok.disabled = inp.value.trim().toUpperCase() !== String(palabra).toUpperCase(); };
      document.addEventListener('keydown', tecla, true);
      document.body.appendChild(ov);
      (inp || ok).focus();
    });
  };
  window.aviso = (texto, titulo = 'Aviso') => window.dialogo({ titulo, texto, aceptar: 'Entendido', cancelar: null });
})();
