# 🗺️ Plan por pasos — Ficha Técnica Scout

> Actualizado: 2026-09-23 (P1 hecho). Continuidad entre sesiones: [HANDOFF.md](HANDOFF.md). Pendientes y decisiones: [00-PENDIENTES.md](00-PENDIENTES.md).

## Cómo usar este plan (ahorro de tokens)

- **Un paso = una sesión corta de Claude.** Al terminar: revisar, hacer commit y `/clear` antes del siguiente.
- Pega el **prompt sugerido** tal cual; ya dice qué archivos tocar y cuáles no.
- Pide **ediciones puntuales**, nunca reescribir `index.html` entero.
- Cada paso termina con verificación en el navegador (`python3 -m http.server` + revisar la consola) y con una línea en `00-PENDIENTES.md`.
- Regla fija: sin backend, sin base de datos y sin Informe Previo (IP) en la Versión 1.

---

## 🟢 VERSIÓN 1 — GitHub Pages (vanilla HTML/CSS/JS)

### ✅ P0 — Orden de carpetas y documentación (hecho 2026-09-23)
Backend a `_futuro/nube-neon/`, `v1.html` a `_archivo/`, bandera `SCOUT_CONFIG.nube = false`, README, plan, pendientes, guías y workflow n8n.

### ✅ P1 — Dividir `index.html` en `css/` y `js/` (hecho 2026-09-23)
`index.html` pasó de ~3600 a ~550 líneas (solo HTML). CSS en `css/base.css`, `barra.css`, `ficha.css`, `modales.css`, `impresion.css` (en ese orden: la cascada importa). JS en scripts clásicos, en este orden: `config.js`, `dialogo.js`, `nube.js`, `datos-il.js`, `estado.js`, `ficha.js`, `edicion.js`, `exportar.js`, `ui.js`, `principal.js`. `programas.html` también se dividió (`css/programas.css`, `js/programas.js`) porque tenía más de 500 líneas embebidas.
Verificado con navegador headless antes y después: 0 errores de consola; I.L. 181 / 197 / 143; agregar I.L., exportar, importar y recargar dan lo mismo (JSON exportado idéntico byte a byte); capturas de escritorio, móvil e impresión **idénticas píxel a píxel**; PDF con las mismas 6 páginas. Detalle de qué hace cada archivo: [../CLAUDE.md](../CLAUDE.md).

### ✅ P2 — Barra lateral retráctil y barra superior mínima (hecho 2026-09-23)
- **Objetivo:** barra lateral contraíble a íconos, muy cuidada, agrupada en **Ficha / Contenido / Datos / Ayuda**; barra superior mínima con título, estado y acciones principales; «Restablecer» escondido en un menú ⋯ con confirmación; en móvil, **barra inferior**; quitar los botones flotantes duplicados (`.fab`).
- **Terminado cuando:** todas las acciones actuales siguen accesibles; se recuerda si la barra está contraída (`localStorage`); en 360 px de ancho no hay scroll horizontal; no quedan botones duplicados; el PDF no muestra la barra.
- **Prompt sugerido:**
  > Paso P2 de docs/00-PLAN.md. En index.html y css/barra.css crea una barra lateral retráctil (contraíble a íconos, estado recordado en localStorage) agrupada en Ficha / Contenido / Datos / Ayuda, una barra superior mínima (título, estado, acciones principales) y mueve «Restablecer» a un menú ⋯ con confirmación. En móvil usa barra inferior. Elimina los .fab duplicados. No cambies la lógica de la ficha ni el PDF. Verifica escritorio y 360 px con navegador headless.

Barra superior mínima (`.topbar`, 44px) con ☰ (contrae/expande la barra lateral), logo, título/estado y a la derecha ✏️ Editar / 📄 PDF / ☁️ Nube (si está activa) / ⋯ (Restablecer, con la confirmación ya existente de `mReset`). Barra lateral (`.sidebar`, 208px ↔ 56px íconos) con los 4 grupos, estado en `localStorage` con clave fuera de `sf_*` (`ui_barra_colapsada`) para que «Restablecer» no la borre. En móvil (<900px) la barra lateral se oculta y aparece una barra inferior fija de 5 accesos (Editar, Indicadores, Momento, PDF, Más) más una hoja deslizante «Más» con el resto de acciones y Restablecer al final. Se eliminó el `.fab-wrap` del PDF y el mecanismo `.l-full/.l-short`. Solo se tocó `index.html`, `css/barra.css`, `css/impresion.css` (selectores de `@media print`) y `js/ui.js` (nuevas funciones `toggleSidebar`/`toggleMoreMenu`/`toggleBottomSheet`); no se tocó `js/edicion.js`, `js/ficha.js` ni `js/exportar.js`.
Ajustes posteriores (mismo día): layout de 3 partes como GHL (barra lateral de alto completo con el logo arriba y «Contraer menú» abajo; header morado solo sobre el contenido con título, estado, ✏️ Editar, 📄 Exportar PDF y ⋯), clases propias del menú (`nav-txt`/`nav-ico`: `.lbl` chocaba con las etiquetas de la ficha), botones de modales rediseñados (secundario/principal/peligro en `css/modales.css`), `scalePages` compensa la barra lateral y el header al escalar, y el modal Restablecer ya no pierde 32px por el `margin-bottom` de la última página.
Verificado con `_herramientas/verificar.mjs` (0 errores de consola, I.L. 181/197/143/0, import/export/recarga idénticos, PDF 6 páginas) más comprobaciones manuales con Playwright: colapso de la barra y persistencia tras recargar, menú ⋯ se abre/cierra al hacer clic afuera, y 360 px de ancho sin scroll horizontal (`scrollWidth === clientWidth`). Se instaló `playwright` como devDependency (no estaba en `package.json`).

### ⏭️ P3 — Asistente de inicio (onboarding de 3 pasos) — saltado (decisión de Danny, 2026-09-23: no es necesario)
- **Objetivo:** al abrir una ficha vacía: 1) rama, 2) fecha y lugar, 3) unidad o **grupal**. Luego dos caminos: **«Crear manual»** o **«Importar JSON de Tico»**.
- **Ayuda de Tico:** si preguntan cómo usarlo: hablar con el Gem de Tico, que les da un JSON; lo descargan y lo importan aquí (enlace al Gem que ya está en la barra).
- **Terminado cuando:** aparece solo si la ficha está vacía; se puede saltar; no vuelve a salir tras completarlo; lo elegido queda en la ficha.
- **Prompt sugerido:**
  > Paso P3 de docs/00-PLAN.md. Agrega un asistente de 3 pasos (rama; fecha y lugar; unidad o grupal) que aparece solo con la ficha vacía, con botón «Saltar» y dos finales: «Crear manual» e «Importar JSON de Tico» (reusa doImportJSON). Incluye un «¿Cómo uso a Tico?»: hablar con el Gem de Tico, descargar el JSON que entrega e importarlo aquí. Archivos: js/asistente.js y css/asistente.css nuevos + ediciones puntuales en index.html. Verifica con navegador headless.

### P4 — Configuración en panel lateral, en vivo
- **Decidido por Danny (2026-09-23):** panel a la **derecha** (~340px, como «Manage view» de GHL), que se abre con ⚙️ y se cierra con ✕; la barra izquierda sigue siendo solo menú. **Se mantiene el modo edición** (no se quita «Editar ficha»), solo se mejora. **Código:** si el JSON importado trae código se respeta; si viene vacío se genera (DDMMAA-R) al importar y al cambiar fecha o rama.
- **Objetivo:** reemplazar el modal «Configurar» por un panel lateral con pestañas; cada cambio se aplica **en vivo** (sin botón «Aplicar») y hay **Deshacer**.
- **Terminado cuando:** todos los campos del modal actual están en el panel; «Deshacer» revierte el último cambio; se guarda en `localStorage` igual que hoy.
- **Prompt sugerido:**
  > Paso P4 de docs/00-PLAN.md. Convierte el modal mConfig en un panel lateral con pestañas y aplicación en vivo de cada campo (sin botón Aplicar), con Deshacer (pila de cambios en memoria). Mantén las mismas claves de localStorage. Solo js/config-panel.js, css/panel.css y ediciones puntuales. Verifica con navegador headless.

### P5 — Índice de secciones con progreso
- **Objetivo:** índice lateral de secciones con estado **✓ / ⚠ / vacío**, y en cada sección vacía un botón claro («+ Agregar objetivo», «+ Agregar momento», «+ Elegir indicadores»…).
- **Terminado cuando:** el estado se actualiza al editar; clic en el índice lleva a la sección; los botones abren la acción correcta.
- **Prompt sugerido:**
  > Paso P5 de docs/00-PLAN.md. Agrega un índice lateral de secciones con estado ✓/⚠/vacío calculado desde el estado actual (reusa syncEmpty) y botones claros en secciones vacías. Archivos js/indice.js y css/indice.css + ediciones puntuales. Verifica con navegador headless.

### P6 — Selector de I.L. y ODS mejorados
- **Objetivo:** selector de I.L. con buscador (sin acentos), filtros por **área** y **etapa**, contador y **chips** de lo elegido; ODS con mejor contraste e íconos.
- **Terminado cuando:** buscar «nutricion» encuentra «nutrición»; filtros combinables; los chips se quitan con un clic; los ODS pasan contraste AA.
- **Prompt sugerido:**
  > Paso P6 de docs/00-PLAN.md. Mejora el modal de Indicadores de Logro (buscador sin acentos, filtros por área y etapa, contador, chips de seleccionados) y los ODS (contraste AA, íconos). No cambies los textos de INDICADORES. Verifica Manada, Tropa y Clan con navegador headless.

### P7 — «Exportar» solo con contenido
- **Objetivo:** los botones de exportar (JSON y PDF) solo se muestran/habilitan si la ficha tiene contenido.
- **Prompt sugerido:**
  > Paso P7 de docs/00-PLAN.md. Muestra los botones de Exportar (JSON/PDF) solo si la ficha tiene contenido (nombre de actividad o al menos un momento/objetivo); actualiza en vivo. Edición puntual en js/ y la barra. Verifica con navegador headless.

### P8 — Programas como biblioteca
- **Objetivo:** `programas.html` pasa a ser una **biblioteca**: tarjetas por rama con sus colores, filtros y **vista calendario**.
- **Fuentes de datos:**
  1. JSON del repo en `programas/`, listados en un **manifiesto `programas/index.json`** (GitHub Pages no lista carpetas).
  2. **Biblioteca local** en `localStorage`: guardar varios programas, renombrar, duplicar, borrar, exportar/importar la biblioteca completa. Manejar el límite de ~5 MB (medir el tamaño, avisar antes de llenarse, sugerir exportar).
- **Terminado cuando:** funciona sin backend; abrir un programa lo carga en la Ficha; el manifiesto se valida (todas sus rutas existen); con la cuota llena no se pierde nada.
- **Prompt sugerido:**
  > Paso P8 de docs/00-PLAN.md. Rehaz programas.html como biblioteca sin backend: (1) lee programas/index.json (créalo con título, rama, fecha y ruta de cada JSON actual) y (2) una biblioteca local en localStorage con guardar/renombrar/duplicar/borrar/exportar/importar y control del límite de ~5 MB. Tarjetas por rama con colores, filtros y vista calendario. Mantén el bloque de nube detrás de SCOUT_CONFIG.nube. Verifica con navegador headless.

### P9 — Corregir las erratas de I.L. en la app
- **Objetivo:** aplicar en `INDICADORES` los 17 textos de la tabla «Erratas del Excel y versión corregida» de [indicadores-de-logro.md](indicadores-de-logro.md) y actualizar los `_ind` de `programas/**/*.json` que los usen. **El Excel no se toca.**
- **Terminado cuando:** los 17 textos coinciden con la columna «Versión corregida»; un script compara y da 0 diferencias; los programas viejos siguen mostrando sus I.L. (mapear texto viejo → nuevo al importar).
- **Prompt sugerido:**
  > Paso P9 de docs/00-PLAN.md. Aplica en INDICADORES (index.html o js/datos-il.js) las 17 correcciones de la tabla «Erratas del Excel y versión corregida» de docs/indicadores-de-logro.md, con un script Python que reemplace texto exacto y reporte. Actualiza los _ind de programas/**/*.json afectados y agrega un mapa texto-viejo→nuevo al importar JSON. No toques el Excel. Verifica con navegador headless.

### P10 — Accesibilidad, contraste y PDF A4
- **Objetivo:** foco visible, navegación con teclado, `aria-*` en modales, contraste AA, y PDF A4 sin cortes (márgenes, saltos de página, fuentes).
- **Prompt sugerido:**
  > Paso P10 de docs/00-PLAN.md. Revisa accesibilidad (teclado, foco, aria en modales y barras), contraste AA y la impresión A4 (saltos, márgenes). Corrige con ediciones puntuales y genera un PDF de prueba con navegador headless para revisarlo.

---

## 🔵 VERSIÓN 2 — Futuro (solo documentado, no se construye todavía)

| Paso | Qué | Dónde está lo que existe |
|---|---|---|
| V2-1 | **Reactivar la nube (Neon)** desde `_futuro/nube-neon/` como puente, o saltar directo a Nest | [_futuro/nube-neon/LEEME.md](../_futuro/nube-neon/LEEME.md) |
| V2-2 | **Aviso n8n** por correo al guardar (primero desde el navegador, luego desde el servidor) | [n8n/COMO-INSTALAR.md](n8n/COMO-INSTALAR.md) |
| V2-3 | **Migración a Next.js + NestJS** (monorepo pnpm, I.L. en `packages/shared`) | [migracion/plan-migracion-por-pasos.md](migracion/plan-migracion-por-pasos.md) |
| V2-4 | **Hosting**: online gratis (Vercel + backend gratis + Neon) o servidor propio (Contabo + Coolify) — por decidir | [guias/01-evaluacion-hosting.md](guias/01-evaluacion-hosting.md), [03](guias/03-nextjs-nestjs-online-gratis.md), [04](guias/04-nextjs-nestjs-servidor-propio.md) |
| V2-5 | **Cuentas por dirigente** (los adultos del formato IP son los usuarios con clave) | [bd-futura/02-adultos.md](bd-futura/02-adultos.md) |
| V2-6 | **Bases de jóvenes y adultos** (datos de menores: cifrado, permisos, sin datos reales en el repo) | [bd-futura/01-jovenes.md](bd-futura/01-jovenes.md), [02-adultos.md](bd-futura/02-adultos.md) |
| V2-7 | **Informe Previo (IP)** generado desde el programa (IP grupal marcado «Grupal») | [bd-futura/03-informe-previo-ip.md](bd-futura/03-informe-previo-ip.md) |
| V2-8 | **PDF en servidor** (Gotenberg) y adjunto en el aviso | [n8n/COMO-INSTALAR.md](n8n/COMO-INSTALAR.md) |

Opcional mientras tanto: publicar la versión vanilla también en Vercel → [guias/02-pasar-a-vercel-gratis.md](guias/02-pasar-a-vercel-gratis.md).
