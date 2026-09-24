# CLAUDE.md — Ficha Técnica Scout (Grupo Scout La Salle Guaparo, ASV)

Plantilla web para planificar la **Ficha Técnica** de los programas de Manada, Tropa, Comunidad y Clan (datos, objetivos, **Indicadores de Logro (I.L.)**, ODS, programa por momentos) y exportarla a PDF/JSON. Publicada en GitHub Pages: https://danend28.github.io/Plantilla-Programa-Scout/ (**repo público**). Todo en español, con acentos correctos.

Historial, cómo exportar el proyecto y prompt de arranque: [docs/HANDOFF.md](docs/HANDOFF.md). Plan: [docs/00-PLAN.md](docs/00-PLAN.md). Pendientes y decisiones: [docs/00-PENDIENTES.md](docs/00-PENDIENTES.md).

## Estado (2026-09-23)
- **Versión 1 = solo GitHub Pages**, HTML/CSS/JS vanilla, sin backend, sin base de datos y sin Informe Previo (IP). Cada ficha vive en el `localStorage` y se comparte exportando el JSON. Tico (Gem de Gemini) entrega un JSON que se importa.
- **Versión 2 = futuro** Next.js + NestJS (solo documentado, no se construye). La nube Neon + Vercel ya hecha está **archivada** en `_futuro/nube-neon/` y apagada con `js/config.js` → `SCOUT_CONFIG.nube = false`.
- Hechos: P0 (orden y documentación) y **P1** (dividir `index.html`). **Siguiente: P2** (barra lateral retráctil + barra superior mínima + barra inferior en móvil); el prompt está en `docs/00-PLAN.md`, sección P2.
- Hay cambios **sin commit** desde P0 (Danny revisa y hace commit/push).

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
| `index.html` | Solo HTML de la Ficha (barra, páginas, modales). Carga los CSS y JS en este orden |
| `css/base.css` → `barra.css` → `ficha.css` → `modales.css` → `impresion.css` | Paletas por rama y reset · barra/drawer/`.fab` y su responsive · páginas de la ficha · modales, ayuda, tooltips · `@media print` y `@page`. El orden es la cascada original |
| `js/config.js` | `SCOUT_CONFIG` (nube apagada) |
| `js/dialogo.js` | `dialogo()` / `aviso()` (reemplazan `alert`/`confirm`) |
| `js/nube.js` | Cliente Neon (inactivo; si se activa, envuelve `saveStorage`) |
| `js/datos-il.js` | `INDICADORES` (Manada 181, Tropa 197, Clan 143), `IND_BASE`, `ODS_LIST`, `AREA_CLS`, logos |
| `js/estado.js` | Variables globales (`editMode`, `progRows`, `indRows`, `ramaActual`…), fechas, `saveStorage`/`loadStorage` (claves `sf_*`), `doReset` |
| `js/ficha.js` | Render: `applyRama`, logos, `renderODS`, `renderInd`/`renderIndPanel`/`applyInd`, programa y días, drag, `syncSec`, `syncEmpty`, modo grupal, páginas extra |
| `js/edicion.js` | `toggleEdit`, modal Configurar (`applyConfig`, `setCode`), I.L. manuales |
| `js/exportar.js` | `buildExportData`, `doExportJSON`, `doImportJSON`, `doPDF` |
| `js/ui.js` | `openM`/`closeM`, `st`, Escape, drawer móvil, `scalePages` |
| `js/principal.js` | `DOMContentLoaded` (carga + primer render) y autoguardado. **Siempre último** |
| `programas.html` + `css/programas.css` + `js/programas.js` | Página Programas (aviso con nube apagada; acceso 🐺 a `promesa-ley-manada.html` en «Todas» y «Manada») |

Reglas: ediciones puntuales (nunca reescribir archivos grandes enteros; mover bloques con scripts); no cambiar textos de `INDICADORES` salvo en P9; las carpetas `_*` no se publican (no agregar `.nojekyll`).

## Cómo verificar
1. `python3 -m http.server 8000` en la raíz y abrir `http://localhost:8000/`.
2. Navegador headless (Playwright + Chromium) contra `index.html`, `programas.html`, `promesa-ley-manada.html`: **0 errores** de consola/`pageerror`/404; I.L. en el modal `mInd` por rama = **181 / 197 / 143 / 0** (Comunidad); importar `programas/2026-05-17.json` → 9 filas de programa, 5 I.L., 2 ODS; agregar 2 I.L. → 7; recargar → persiste; exportar → reimportar en contexto limpio → igual; capturas escritorio (1440) y móvil (375, con drawer); `emulateMedia('print')` y `page.pdf()` (6 páginas con ese programa).
3. En este equipo (WSL) Chromium necesita `libnspr4`/`libnss3`: si falla al lanzar, usar `LD_LIBRARY_PATH` con las librerías extraídas o `npx playwright install-deps` (pide sudo).
4. Apagar el servidor al terminar.

- Script listo: `_herramientas/verificar.mjs` (errores de consola, I.L. por rama, import/export, PDF, capturas). Uso en su cabecera.

## Cómo pedir el siguiente paso
Un paso del plan por sesión: pega el **prompt sugerido** del paso en `docs/00-PLAN.md` (ej. «Paso P2 de docs/00-PLAN.md…»). Al terminar: verificar como arriba, marcar el paso ✅ en `00-PLAN.md` y `00-PENDIENTES.md`, y que Danny haga commit antes del siguiente (`/clear`).
