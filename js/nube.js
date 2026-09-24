/* ╔══════════════════════════════════════════════════════════╗
   ║  ☁️ NUBE — guarda/carga programas en la base de datos     ║
   ║  localStorage sigue siendo el borrador (funciona offline). ║
   ╚══════════════════════════════════════════════════════════╝
   Claves en localStorage:
     sf_nube-id / sf_nube-version / sf_nube-version-actual / sf_nube-titulo
     sf_nube-hash (hash de la versión en la nube) / sf_nube-base-local / sf_nube-sucio
     scout_autor (nombre recordado) · scout_clave (clave del grupo, si se usa)
     sfbak_borrador (copia del borrador local antes de abrir otro programa)
   Las claves sf_nube-* se borran con "Restablecer" (así el siguiente guardado crea un programa nuevo). */
(function () {
  // ⚙️ Nube desactivada (js/config.js → SCOUT_CONFIG.nube = false): oculta los botones y no define nada.
  if (!(window.SCOUT_CONFIG && window.SCOUT_CONFIG.nube)) {
    const css = document.createElement('style');
    css.textContent = '.btn-nube,[data-solo-nube]{display:none!important}';
    document.head.appendChild(css);
    return;
  }
  const K = k => 'sf_' + k;
  const API = 'api/programas';
  const RAMAS = ['manada', 'tropa', 'comunidad', 'clan', 'grupal'];
  const BACKUP = 'sfbak_borrador';

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { console.warn('[nube] localStorage', e); } },
    del(k) { try { localStorage.removeItem(k); } catch { } },
  };

  // Diálogos propios (js/dialogo.js); si no cargó, cae a los nativos.
  const preguntar = op => (window.dialogo ? window.dialogo(op) : Promise.resolve(confirm(`${op.titulo}\n\n${op.texto}`)));
  const avisar = (titulo, texto) => (window.dialogo ? window.dialogo({ titulo, texto, aceptar: 'Entendido', cancelar: null }) : Promise.resolve(alert(`${titulo}\n\n${texto}`)));

  let errorPrecarga = null;
  let recienCargado = false;
  let salud = null;

  // ── Hash canónico (igual que lib/hash.js del servidor) ───────
  function canon(v) {
    if (Array.isArray(v)) return v.map(x => (x === undefined ? null : canon(x)));
    if (v && typeof v === 'object') {
      const o = {}; for (const k of Object.keys(v).sort()) if (v[k] !== undefined) o[k] = canon(v[k]); return o;
    }
    return v;
  }
  async function hashDe(obj) {
    if (!window.crypto?.subtle) return null;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canon(obj))));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function textoPlano(html) {
    const d = document.createElement('div'); d.innerHTML = html || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function ramaDe(c) {
    const r = String(c._rama || c._data?.unidad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return RAMAS.find(x => r.includes(x)) || 'manada';
  }

  // ── Metadata del navegador (lo demás lo agrega el servidor) ──
  function metaCliente() {
    const uad = navigator.userAgentData;
    let tz = null; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { }
    return {
      user_agent: navigator.userAgent,
      idioma: navigator.language,
      idiomas: navigator.languages ? [...navigator.languages] : null,
      zona_horaria: tz,
      pantalla: screen ? `${screen.width}x${screen.height}` : null,
      ventana: `${innerWidth}x${innerHeight}`,
      densidad: window.devicePixelRatio || null,
      plataforma: uad?.platform || navigator.platform || null,
      movil: typeof uad?.mobile === 'boolean' ? uad.mobile : /Mobi|Android/i.test(navigator.userAgent),
      hora_local: new Date().toString().slice(0, 33),
    };
  }

  // ── Borrador local ⇄ contenido de la nube ────────────────────
  function clavesBorrador() {
    const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('sf_')) out.push(k); } } catch { }
    return out;
  }
  function hayBorradorLocal() {
    return Boolean(textoPlano(ls.get(K('nombre-act'))) || ls.get(K('prog')) && ls.get(K('prog')) !== '[]');
  }
  function respaldarBorrador() {
    const datos = {}; clavesBorrador().forEach(k => { datos[k] = ls.get(k); });
    ls.set(BACKUP, JSON.stringify({ fecha: new Date().toISOString(), titulo: textoPlano(ls.get(K('nombre-act'))), datos }));
  }
  function escribirEnStorage(c) {
    const indExtraPrevio = ls.get(K('ind_extra'));
    clavesBorrador().forEach(k => ls.del(k));
    Object.entries(c._data || {}).forEach(([k, v]) => ls.set(K(k), v ?? ''));
    ls.set(K('logos'), JSON.stringify(c._logos || {}));
    ls.set(K('ods'), JSON.stringify(c._ods || []));
    ls.set(K('prog'), JSON.stringify(c._prog || []));
    ls.set(K('ind'), JSON.stringify(c._ind || []));
    ls.set(K('rama'), ramaDe(c));
    ls.set(K('fecha-ini'), c._fechaIni || '');
    ls.set(K('fecha-fin'), c._fechaFin || '');
    ls.set(K('hora-ini-d1'), c._hora_ini || c._data?.['hora-inicio'] || '10:00');
    ls.set(K('hora-cierre-ul'), c._hora_cierre || c._data?.['hora-cierre'] || '13:00');
    if (c._doc_title) ls.set(K('doc-title'), c._doc_title);
    ls.set(K('extra-pages'), JSON.stringify(c._extra_pages || []));
    ls.set(K('grupal-comunidad'), c._grupal_comunidad ? '1' : '0');
    let extra = {}; try { extra = JSON.parse(indExtraPrevio || '{}'); } catch { }
    Object.assign(extra, c._indicadores_extra || {});
    if (Object.keys(extra).length) ls.set(K('ind_extra'), JSON.stringify(extra));
  }
  function vincular(programa, version, hash) {
    ls.set(K('nube-id'), programa.id);
    if (version != null) ls.set(K('nube-version'), String(version));
    if (programa.version_actual != null) ls.set(K('nube-version-actual'), String(programa.version_actual));
    if (programa.titulo) ls.set(K('nube-titulo'), programa.titulo);
    if (hash) ls.set(K('nube-hash'), hash);
  }
  function desvincularClaves() {
    ['nube-id', 'nube-version', 'nube-version-actual', 'nube-titulo', 'nube-hash', 'nube-base-local', 'nube-sucio'].forEach(k => ls.del(K(k)));
  }
  function ponerIdEnUrl(id) {
    try {
      const u = new URL(location.href);
      if (id) u.searchParams.set('id', id); else u.searchParams.delete('id');
      u.searchParams.delete('version');
      history.replaceState(null, '', u);
    } catch { }
  }

  // ── Peticiones ───────────────────────────────────────────────
  function headers() {
    const h = { 'content-type': 'application/json' };
    const clave = document.getElementById('nubeClave')?.value?.trim() || ls.get('scout_clave');
    if (clave) h['x-clave-grupo'] = clave;
    return h;
  }
  async function pedir(url, opts = {}) {
    let res;
    try { res = await fetch(url, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } }); }
    catch { const e = new Error('No se pudo conectar con la nube (¿sin internet?). Tu borrador sigue guardado en este navegador.'); e.red = true; throw e; }
    let data = null; try { data = await res.json(); } catch { }
    if (!data) { const e = new Error(res.status === 404 ? 'La nube no está configurada en este sitio (no existe /api).' : `Error ${res.status} del servidor.`); e.status = res.status; throw e; }
    data.status = res.status;
    return data;
  }

  // ── Precarga: ?id=...[&version=N] ────────────────────────────
  window.nubePrecargar = async function () {
    const p = new URLSearchParams(location.search);
    const id = p.get('id'); if (!id) return;
    const version = p.get('version');
    const mismo = ls.get(K('nube-id')) === id;
    if (mismo && !version && ls.get(K('nube-sucio')) === '1') {
      const seguir = await preguntar({
        titulo: '☁️ Cambios sin subir',
        texto: 'Tienes cambios de este programa en este navegador que todavía no subiste a la nube.',
        aceptar: 'Seguir con mi borrador', cancelar: 'Cargar la versión de la nube',
      });
      if (seguir) return;
    }
    let data;
    try {
      data = await pedir(`${API}/${encodeURIComponent(id)}${version ? `?version=${encodeURIComponent(version)}` : ''}`);
    } catch (e) { errorPrecarga = e.message; return; }
    // Sin clave de lectura: si es el mismo programa del borrador, se sigue con el borrador local sin avisar.
    if (data.status === 401 && mismo) return;
    if (!data.ok) { errorPrecarga = data.mensaje || 'No se pudo abrir el programa.'; return; }
    if (!mismo && hayBorradorLocal()) respaldarBorrador();
    escribirEnStorage(data.version.contenido);
    vincular(data.programa, data.version.version, data.version.content_hash);
    ls.set(K('nube-sucio'), '0');
    recienCargado = true;
  };

  // ── Estado / indicador ───────────────────────────────────────
  function pintarEstado(texto, clase) {
    // Etiqueta de estado en la barra y en el menú móvil
    document.querySelectorAll('[data-nube-estado]').forEach(e => { e.textContent = texto; e.className = 'tb-nube' + (clase ? ' ' + clase : ''); });
  }
  function refrescarIndicador() {
    const id = ls.get(K('nube-id'));
    if (!id) return pintarEstado('Sin subir', '');
    const v = ls.get(K('nube-version')); const va = ls.get(K('nube-version-actual'));
    if (ls.get(K('nube-sucio')) === '1') return pintarEstado(`v${v} · sin subir`, 'pend');
    if (va && v && Number(va) > Number(v)) return pintarEstado(`v${v} (hay v${va})`, 'pend');
    pintarEstado(`v${v} ✓`, 'ok');
  }
  let tRevisar = null;
  function revisarPronto() { clearTimeout(tRevisar); tRevisar = setTimeout(revisar, 700); }
  async function revisar() {
    if (!ls.get(K('nube-id')) || typeof buildExportData !== 'function') return refrescarIndicador();
    const h = await hashDe(buildExportData());
    if (h) {
      const sucio = h !== ls.get(K('nube-base-local')) && h !== ls.get(K('nube-hash'));
      ls.set(K('nube-sucio'), sucio ? '1' : '0');
    } else {
      ls.set(K('nube-sucio'), '1');
    }
    refrescarIndicador();
  }

  window.nubeIniciar = async function () {
    // Marca cambios cada vez que la ficha se guarda en localStorage o se escribe.
    if (typeof window.saveStorage === 'function' && !window.saveStorage._nube) {
      const original = window.saveStorage;
      window.saveStorage = function () { const r = original.apply(this, arguments); revisarPronto(); return r; };
      window.saveStorage._nube = true;
    }
    document.addEventListener('input', revisarPronto, true);
    const autor = ls.get('scout_autor'); if (autor) { const el = document.getElementById('nubeAutor'); if (el) el.value = autor; }
    if (recienCargado && typeof buildExportData === 'function') {
      // Línea base: cómo queda el programa recién abierto al pasar por la página.
      const h = await hashDe(buildExportData()); if (h) ls.set(K('nube-base-local'), h);
      ls.set(K('nube-sucio'), '0');
      const v = ls.get(K('nube-version')); const va = ls.get(K('nube-version-actual'));
      if (typeof st === 'function') st(`☁️ Abierto v${v}`);
    }
    if (errorPrecarga) { pintarEstado('error', 'err'); avisar('☁️ No se pudo abrir el programa', errorPrecarga + '\n\nSe mantiene el borrador de este navegador.'); }
    else refrescarIndicador();
  };

  window.nubeTrasRestablecer = function () { desvincularClaves(); ponerIdEnUrl(null); refrescarIndicador(); };

  // ── Modal ────────────────────────────────────────────────────
  function msg(t, clase) { const el = document.getElementById('nubeMsg'); if (el) { el.textContent = t || ''; el.className = 'nube-msg' + (clase ? ' ' + clase : ''); } }
  function pintarInfo() {
    const info = document.getElementById('nubeInfo'); if (!info) return;
    const id = ls.get(K('nube-id'));
    const titulo = textoPlano(document.getElementById('hdr-nombre-act')?.innerHTML) || '(sin nombre)';
    if (id) {
      const v = ls.get(K('nube-version')); const va = ls.get(K('nube-version-actual'));
      info.innerHTML = `Este borrador está vinculado a <b>«${escapar(ls.get(K('nube-titulo')) || titulo)}»</b>, editando a partir de la <b>v${escapar(v)}</b>${va && va !== v ? ` (la última en la nube es v${escapar(va)})` : ''}.<br>Al guardar se crea una <b>nueva versión</b>; las anteriores quedan en el historial.`;
    } else {
      info.innerHTML = `<b>«${escapar(titulo)}»</b> todavía no está en la nube. Al guardar se crea el programa <b>una sola vez</b>; los siguientes guardados serán nuevas versiones.`;
    }
    const nuevoBtn = document.getElementById('nubeNuevoBtn'); if (nuevoBtn) nuevoBtn.hidden = !id;
    const rest = document.getElementById('nubeRestaurarBtn'); if (rest) rest.hidden = !ls.get(BACKUP);
    const claveWrap = document.getElementById('nubeClaveWrap');
    if (claveWrap) {
      claveWrap.style.display = salud?.edicion_configurada ? '' : 'none';
      const lbl = claveWrap.querySelector('.fl');
      if (lbl) lbl.textContent = 'Clave del grupo (opcional)';
      const inp = document.getElementById('nubeClave');
      if (inp && !inp.value && ls.get('scout_clave')) inp.value = ls.get('scout_clave');
      const nota = document.getElementById('nubeClaveNota');
      if (nota) nota.textContent = salud?.edicion_configurada
        ? 'Con la clave de edición la versión queda verificada; sin ella se guarda igual, marcada «sin verificar».' : '';
    }
  }
  function escapar(t) { return String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  window.nubeAbrir = async function () {
    msg('');
    pintarInfo();
    if (typeof openM === 'function') openM('mNube');
    try {
      const r = await fetch('api/salud', { headers: { accept: 'application/json' } });
      salud = await r.json();
      if (!salud.base_de_datos) msg('⚠️ La nube todavía no está configurada (falta la base de datos). Tu borrador sigue en este navegador.', 'err');
      else if (!salud.conectada) msg('⚠️ No se pudo conectar con la base de datos. Inténtalo más tarde.', 'err');
    } catch {
      salud = null;
      msg('⚠️ No se pudo contactar la nube (¿sin internet o sitio sin /api?). Tu borrador sigue en este navegador.', 'err');
    }
    pintarInfo();
  };

  window.nubeDesvincular = async function () {
    if (!await preguntar({
      titulo: '🆕 Guardar como programa nuevo',
      texto: 'Esto desvincula el borrador del programa actual en la nube. Al guardar se creará un programa NUEVO.\n\nCambia la fecha o el nombre para que no choque con el original.',
      aceptar: 'Desvincular', cancelar: 'Cancelar',
    })) return;
    desvincularClaves(); ponerIdEnUrl(null); refrescarIndicador(); pintarInfo(); msg('Listo: el próximo guardado creará un programa nuevo.', 'ok');
  };

  window.nubeRestaurarBorrador = async function () {
    let b; try { b = JSON.parse(ls.get(BACKUP) || 'null'); } catch { b = null; }
    if (!b) return;
    if (!await preguntar({
      titulo: '↩️ Restaurar borrador anterior',
      texto: `¿Restaurar el borrador «${b.titulo || 'sin nombre'}» guardado el ${new Date(b.fecha).toLocaleString('es-VE')}?\n\nLo que está abierto ahora se reemplaza en este navegador (si está en la nube, allá sigue).`,
      aceptar: 'Restaurar', cancelar: 'Cancelar',
    })) return;
    clavesBorrador().forEach(k => ls.del(k));
    Object.entries(b.datos || {}).forEach(([k, v]) => { if (v != null) ls.set(k, v); });
    ls.del(BACKUP);
    const u = new URL(location.href); u.searchParams.delete('id'); u.searchParams.delete('version');
    location.href = u.toString();
  };

  let guardando = false;
  window.nubeGuardar = async function (opciones = {}) {
    if (guardando) return;
    if (typeof buildExportData !== 'function') return msg('Esta página no soporta la nube.', 'err');
    if (typeof syncProgRows === 'function') try { syncProgRows(); } catch { }
    if (typeof saveStorage === 'function') saveStorage();
    const contenido = buildExportData();
    if (!textoPlano(contenido._data?.['nombre-act'])) return msg('Ponle un nombre a la actividad antes de guardarla en la nube.', 'err');
    const autor = document.getElementById('nubeAutor')?.value?.trim() || '';
    ls.set('scout_autor', autor);
    const id = opciones.id || ls.get(K('nube-id'));
    const body = { contenido, autor, cliente: metaCliente() };
    if (id) { body.version_base = opciones.versionBase ?? (Number(ls.get(K('nube-version'))) || null); if (opciones.forzar) body.forzar = true; }

    const btn = document.getElementById('nubeGuardarBtn');
    guardando = true; if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando…'; }
    msg('Guardando…');
    try {
      const data = await pedir(id ? `${API}/${encodeURIComponent(id)}` : API, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      const hLocal = await hashDe(contenido);

      if (data.status === 401) {
        ls.del('scout_clave');
        document.getElementById('nubeClaveWrap').style.display = '';
        document.getElementById('nubeClave')?.focus();
        return msg('🔒 ' + (data.mensaje || 'Se necesita la clave del grupo.') + ' Escríbela y vuelve a guardar.', 'err');
      }
      if (data.error === 'programa_existe' && data.programa) {
        const p = data.programa;
        if (await preguntar({
          titulo: '📚 Ese programa ya existe',
          texto: `${p.titulo ? `Ya existe «${p.titulo}» (${p.rama}, v${p.version_actual})` : 'Ya existe un programa'} con la misma rama, fecha y nombre.\n\n¿Guardar lo tuyo como NUEVA VERSIÓN de ese programa? No se duplica.`,
          aceptar: 'Guardar como nueva versión', cancelar: 'No guardar',
        })) {
          guardando = false;
          return await window.nubeGuardar({ id: p.id, versionBase: p.version_actual });
        }
        return msg('No se guardó. Cambia la fecha o el nombre si es un programa distinto.', 'err');
      }
      if (data.error === 'conflicto_version') {
        const u = data.ultima;
        const quien = u?.autor ? ` por ${u.autor}` : '';
        const cuando = u?.created_at ? ` el ${new Date(u.created_at).toLocaleString('es-VE')}` : '';
        if (await preguntar({
          titulo: '⚠️ Hay una versión más nueva',
          texto: `Alguien guardó la v${data.version_actual}${quien}${cuando} después de la versión que estás editando.\n\n¿Guardar la tuya igualmente como v${data.version_actual + 1}? La otra queda en el historial.`,
          aceptar: `Guardar como v${data.version_actual + 1}`, cancelar: 'No guardar',
        })) {
          guardando = false;
          return await window.nubeGuardar({ id, versionBase: data.version_actual, forzar: true });
        }
        return msg('No se guardó. Puedes abrir la última versión desde 📚 Programas.', 'err');
      }
      if (!data.ok) return msg('❌ ' + (data.mensaje || 'No se pudo guardar.'), 'err');

      const clave = document.getElementById('nubeClave')?.value?.trim(); if (clave) ls.set('scout_clave', clave);
      const sinVerificar = data.version && data.version.verificada === false && (data.estado === 'creado' || data.estado === 'nueva_version')
        ? ' Quedó como «sin verificar» (se guardó sin la clave de edición).' : '';
      const v = data.version?.version ?? data.programa?.version;
      vincular({ ...data.programa, titulo: data.programa.titulo || textoPlano(contenido._data['nombre-act']) }, v, data.hash);
      if (hLocal) ls.set(K('nube-base-local'), hLocal);
      ls.set(K('nube-sucio'), '0');
      ponerIdEnUrl(data.programa.id);
      refrescarIndicador(); pintarInfo();
      const textos = {
        creado: `✅ Programa creado en la nube (v1).`,
        nueva_version: `✅ Guardado como v${v}.`,
        sin_cambios: `ℹ️ No hay cambios respecto a la v${v}; no se creó una versión nueva.`,
        duplicado: `ℹ️ Este mismo contenido ya estaba en la nube${data.programa.titulo ? ` («${data.programa.titulo}» v${v})` : ''}. No se duplicó; quedó vinculado a ese programa.`,
      };
      msg((textos[data.estado] || '✅ Guardado.') + sinVerificar, 'ok');
      if (typeof st === 'function') st(data.estado === 'sin_cambios' || data.estado === 'duplicado' ? '☁️ Sin cambios' : `☁️ Guardado v${v}`);
    } catch (e) {
      msg('❌ ' + e.message, 'err'); pintarEstado('error', 'err');
    } finally {
      guardando = false; if (btn) { btn.disabled = false; btn.textContent = '☁️ Guardar'; }
    }
  };
})();
