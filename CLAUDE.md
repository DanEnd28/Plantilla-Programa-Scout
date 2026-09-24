# CLAUDE.md — Ficha Técnica Scout (Grupo Scout La Salle Guaparo, ASV)

Plantilla web para planificar la **Ficha Técnica** de los programas de Manada, Tropa, Comunidad y Clan (datos, objetivos, **Indicadores de Logro (I.L.)**, ODS, programa por momentos) y exportarla a PDF/JSON. Publicada en GitHub Pages: https://danend28.github.io/Plantilla-Programa-Scout/ (**repo público**). Todo en español, con acentos correctos.

Historial, cómo exportar el proyecto y prompt de arranque: [docs/HANDOFF.md](docs/HANDOFF.md). Plan: [docs/00-PLAN.md](docs/00-PLAN.md). Pendientes y decisiones: [docs/00-PENDIENTES.md](docs/00-PENDIENTES.md).

## Estado (2026-09-23)
- **Versión 1 = solo GitHub Pages**, HTML/CSS/JS vanilla, sin backend, sin base de datos y sin Informe Previo (IP). Cada ficha vive en el `localStorage` y se comparte exportando el JSON. Tico (Gem de Gemini) entrega un JSON que se importa.
- **Versión 2 = futuro** Next.js + NestJS (solo documentado, no se construye). La nube Neon + Vercel ya hecha está **archivada** en `_futuro/nube-neon/` y apagada con `js/config.js` → `SCOUT_CONFIG.nube = false`.
- Hechos: P0, P1, **P2** (layout estilo GHL: barra lateral retráctil de alto completo + header morado + barra inferior en móvil) **P4** (panel derecho: Configuración en vivo con Deshacer + Programa en tarjetas arrastrables, días automáticos), **P5** (índice de secciones con progreso), **P6** (selector de I.L. con buscador/filtros/chips; ODS AA con íconos), **P7** (exportar solo con contenido), **P8** (Programas como biblioteca: manifiesto del repo + «Mi biblioteca» local + calendario), **P9** (17 erratas de I.L. aplicadas en la app) y **P10** (accesibilidad: axe 0 problemas, teclado y foco; impresión sin hojas vacías ni desbordes). **P3 saltado** por decisión de Danny. **La Versión 1 del plan está completa**; lo siguiente es la Versión 2 (solo documentada).
- Danny revisa y hace commit/push al terminar cada paso.

## Decisiones de Danny (no reabrir sin preguntar)
- Sin plazos de borrado de datos: solo actualización.
- El IP grupal se marca **«Grupal»**.
- **Comunidad aún no tiene I.L.** No inventarlos.
- **No tocar los Excel.** Las erratas de I.L. se corrigen en la app y en `docs/indicadores-de-logro.md`, nunca en el Excel (aplicarlas en el código es P9).
- No tocar `_archivo/v1.html` ni `ayuda.html` salvo pedido explícito.
- Datos personales reales **fuera del repo**, en `../scout-privado/` (no se lee ni se sube). En el repo solo ejemplos inventados.
- **No hacer commit ni push**, ni subir/activar nada en n8n, sin confirmación explícita de Danny.
- Claves: `_futuro/nube-neon/.env.local` (ignorado por `.gitignore` → `.env*`). Nunca escribir claves en un `.md` ni mostrarlas.

## Convenciones del código (tras P1)
Scripts **clásicos** (no `type="module"`): comparten el ámbito global y los `onclick="…"` del HTML llaman funciones globales. **El orden de carga importa**; no reordenar sin verificar.

| Archivo | Qué hace |
|---|---|
| `index.html` | Solo HTML de la Ficha (barra lateral, header, panel derecho, páginas dentro de `.pages-wrap`, y los modales **fuera** de `.pages-wrap` para que no hereden su `zoom`). Carga los CSS y JS en este orden |
| `css/base.css` → `barra.css` → `ficha.css` → `modales.css` → `panel.css` → `indice.css` → `impresion.css` | Paletas por rama y reset · barra lateral, header, barra inferior/hoja «Más», menú ⋯, botones `.btn` y exportar deshabilitado · páginas de la ficha y ODS · modales (y sus botones), ayuda, tooltips y selector de I.L. · panel derecho (Configuración y tarjetas del Programa) · vista Secciones, contador y botones de sección vacía · `@media print` y `@page`. El orden es la cascada |
| `js/config.js` | `SCOUT_CONFIG` (nube apagada) |
| `js/dialogo.js` | `dialogo()` / `aviso()` (reemplazan `alert`/`confirm`) |
| `js/nube.js` | Cliente Neon (inactivo; si se activa, envuelve `saveStorage`) |
| `js/datos-il.js` | `INDICADORES` (Manada 181, Tropa 197, Clan 143), `IND_BASE`, `ODS_LIST`, `ODS_ICONOS`, `AREA_CLS`, logos |
| `js/estado.js` | Variables globales (`editMode`, `progRows`, `indRows`, `ramaActual`…), fechas, `saveStorage`/`loadStorage` (claves `sf_*`), `doReset` |
| `js/ficha.js` | Render: `applyRama`, logos, `renderODS`, `renderInd`/`renderIndPanel`/`applyInd`, programa (`renderProg`, `horasProg`; cada momento guarda su `dia`, los encabezados de día se generan solos con varios días, hora de inicio por día en `horasDia` → `sf_horas-dia`/`_horas_dia`; `normalizarProg` convierte los viejos `day-sep`), drag, `syncSec`, `syncEmpty`, modo grupal, páginas extra |
| `js/edicion.js` | `toggleEdit`, código (`setCode`, `codigoAuto`), I.L. manuales |
| `js/exportar.js` | `buildExportData` (incluye `_codigo`), `doExportJSON`, `doImportJSON` (respeta `_codigo` o lo genera), `doPDF`, `fichaTieneContenido`/`exportarActualizar` (P7: botones `[data-requiere-contenido]`) |
| `js/ui.js` | `openM`/`closeM` (llevan y devuelven el foco), `st`, Escape, barra lateral (`toggleSidebar`, clave `ui_barra_colapsada`), menú ⋯, hoja «Más», `scalePages` (compensa barra lateral, header y panel) |
| `js/config-panel.js` | Panel derecho (vistas `config` y `programa`, `panelMostrar`) y vista Configuración (`openConfigPanel`/`closeConfigPanel`/`toggleConfigPanel`, `cfgDeshacer`): aplica cada campo `cfg-*` en vivo. Reemplazó al modal `mConfig` y a `applyConfig` |
| `js/programa-panel.js` | Vista Programa: momentos como tarjetas en tiempo real (día, hora de inicio del día, arrastrar desde ⠿ también a otro día, ↑↓, borrar, agregar). Reemplazó al modal `mProg` y a «Separar día» |
| `js/indice.js` | P5: vista Secciones (✓/⚠/vacío), contador del header y botones de sección vacía; un `MutationObserver` sobre `#fichaWrap` lo recalcula y llama a `exportarActualizar` |
| `js/selector-il.js` | P6: sobre `renderIndPanel` → buscador sin acentos, filtros de área y etapa, contador, chips, marca «en la ficha» |
| `js/biblioteca-datos.js` | P8: «Mi biblioteca» en `localStorage` (clave `biblio_programas`, fuera de `sf_*`: «Restablecer» no la borra): guardar, renombrar, duplicar, borrar, exportar/importar, uso y límite (~5 M caracteres, aviso al 80 %). Lo usan la Ficha y Programas |
| `js/biblioteca-ficha.js` | P8, lado Ficha: «💾 Guardar en biblioteca» (vínculo `sf_biblio_id` para actualizar en vez de duplicar) y abrir `index.html?abrir=local:<id>` / `?abrir=repo:<ruta>` (guarda sola la ficha actual antes de reemplazarla) |
| `js/accesibilidad.js` | P10: nombres y roles (campos editables, logos, diálogos), teclado en `role=button`, foco atrapado en modales. Va antes de `principal.js` |
| `js/principal.js` | `DOMContentLoaded` (carga + primer render) y autoguardado. **Siempre último** |
| `programas.html` + `css/programas.css` + `css/biblioteca.css` + `js/biblioteca.js` | Biblioteca (P8): programas del grupo (`programas/index.json`) + «Mi biblioteca», tarjetas por rama, filtros, vista calendario, acceso 🐺 a `promesa-ley-manada.html`. El bloque de la nube (`#nubeSeccion` + `js/programas.js`) solo se carga con `SCOUT_CONFIG.nube` |
| `programas/index.json` | Manifiesto de los JSON del repo. **Regenerar** con `python3 _herramientas/manifiesto.py` al agregar, mover o borrar un programa |

Reglas: ediciones puntuales (nunca reescribir archivos grandes enteros; mover bloques con scripts); los textos de `INDICADORES` solo cambian con `_herramientas/erratas_il.py` desde la tabla de `docs/indicadores-de-logro.md`; las carpetas `_*` no se publican (no agregar `.nojekyll`).

## Cómo verificar
1. `python3 -m http.server 8000` en la raíz y abrir `http://localhost:8000/`.
2. Navegador headless (Playwright + Chromium) contra `index.html`, `programas.html`, `promesa-ley-manada.html`: **0 errores** de consola/`pageerror`/404; I.L. en el modal `mInd` por rama = **181 / 197 / 143 / 0** (Comunidad); importar `programas/2026-05-17.json` → 9 filas de programa, 5 I.L., 2 ODS; agregar 2 I.L. → 7; recargar → persiste; exportar → reimportar en contexto limpio → igual; capturas escritorio (1440) y móvil (375, con la hoja «Más»); PDF con `emulateMedia('print')` en Carta (`preferCSSPageSize`) y A4: 6 páginas y ningún bloque desbordado. **El PDF debe generarse con media `print`**: con `screen` sale otra cosa (así estaba antes de P10).
3. En este equipo (WSL) Chromium necesita `libnspr4`/`libnss3`/`libasound2t64`. Sin sudo: `apt-get download libnspr4 libnss3 libasound2t64`, extraer con `dpkg-deb -x <deb> /tmp/scout-libs/extracted` y correr con `LD_LIBRARY_PATH=/tmp/scout-libs/extracted/usr/lib/x86_64-linux-gnu`. Para que las capturas muestren emojis: `fonts-noto-color-emoji` extraído igual + `FONTCONFIG_FILE` apuntando a un `fonts.conf` que incluya esa carpeta. `playwright` está en `devDependencies` (`npm install`).
4. Apagar el servidor al terminar (en un comando aparte: `pkill -f "http.server"` dentro del mismo comando que lo nombra se mata a sí mismo).

- Scripts listos en `_herramientas/` (uso en su cabecera; servidor en `:3472`):
  - `verificar.mjs` — errores de consola, I.L. por rama, import/export, PDF Carta y A4, bloques desbordados, capturas.
  - `accesibilidad.mjs` — axe-core (WCAG 2.1 AA) en 9 escenarios de la Ficha y Programas; debe dar 0 problemas (`--detalle`, `--todo`).
  - `ver-pdf.mjs <pdf> <carpeta>` — renderiza cada hoja de un PDF a PNG con pdf.js para revisar cortes.
  - `manifiesto.py [--verificar]` — genera/valida `programas/index.json`.
  - `erratas_il.py [--verificar]` — erratas de I.L.; `--verificar` debe dar 0 diferencias.
- `devDependencies`: `playwright`, `axe-core`, `pdfjs-dist` (`npm install`).

## Cómo pedir el siguiente paso
Un paso del plan por sesión: pega el **prompt sugerido** del paso en `docs/00-PLAN.md` (ej. «Paso P2 de docs/00-PLAN.md…»). Al terminar: verificar como arriba, marcar el paso ✅ en `00-PLAN.md` y `00-PENDIENTES.md`, y que Danny haga commit antes del siguiente (`/clear`).
