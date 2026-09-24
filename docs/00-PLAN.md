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

### ✅ P4 — Configuración en panel lateral, en vivo (hecho 2026-09-23)
- **Decidido por Danny (2026-09-23):** panel a la **derecha** (~340px, como «Manage view» de GHL), que se abre con ⚙️ y se cierra con ✕; la barra izquierda sigue siendo solo menú. **Se mantiene el modo edición** (no se quita «Editar ficha»), solo se mejora. **Código:** si el JSON importado trae código se respeta; si viene vacío se genera (DDMMAA-R) al importar y al cambiar fecha o rama.
- **Objetivo:** reemplazar el modal «Configurar» por un panel lateral con pestañas; cada cambio se aplica **en vivo** (sin botón «Aplicar») y hay **Deshacer**.
- **Terminado cuando:** todos los campos del modal actual están en el panel; «Deshacer» revierte el último cambio; se guarda en `localStorage` igual que hoy.
- **Prompt sugerido:**
  > Paso P4 de docs/00-PLAN.md. Convierte el modal mConfig en un panel lateral con pestañas y aplicación en vivo de cada campo (sin botón Aplicar), con Deshacer (pila de cambios en memoria). Mantén las mismas claves de localStorage. Solo js/config-panel.js, css/panel.css y ediciones puntuales. Verifica con navegador headless.

Panel a la derecha (340px; en móvil ocupa la pantalla entre el header y la barra inferior) con pestañas «General» (grupo, rama + opción grupal, responsable, título, código) y «Fecha y horario» (fechas, horas, aviso multi-día). Se abre con ⚙️ Configurar (barra lateral u hoja «Más»), se cierra con ✕ o Escape; en escritorio empuja la ficha. Cada campo se aplica por separado (para no pisar lo editado a mano en la ficha), con las mismas claves `sf_*`; los textos se aplican 350 ms después de dejar de escribir y una ráfaga cuenta como un solo paso de «Deshacer». `applyConfig` y el modal `mConfig` se eliminaron (su lógica está en `js/config-panel.js`).
**Ajuste (pedido de Danny):** Configuración en una sola vista (sin pestañas). **Programa en el panel derecho** (tarjetas **arrastrables** desde ⠿, también a otro día; ↑↓ en el celular) (🗓️ Programa en la barra lateral y en la barra inferior; «➕ Agregar momento» de la ficha también lo abre): cada momento es una tarjeta editable (duración, actividad, descripción, materiales, responsable) que se ve al instante en la tabla; ↑↓ reordena dentro del día; 🗑 borra (pide confirmación si tiene texto); al cerrar el panel se quitan las tarjetas vacías. **Se quitó «Separar día»**: con varios días el programa se agrupa solo; cada momento elige su día y cada día tiene su hora de inicio (día 1 = hora de inicio de la ficha), y la hora de cada momento sigue a la del anterior de ese día. Datos: `dia` en cada momento (se omite si es 0) y `horasDia` (`sf_horas-dia`, `_horas_dia`); los `day-sep` viejos se convierten al importar. Se eliminaron `addDaySep`, `addProgRow` y el modal `mProg`; la «hora manual» por momento (que ya se perdía al recalcular) la reemplaza la hora de inicio de cada día.
**Código:** antes no se guardaba de forma recuperable (se escribía `sf_codigo` pero nunca se leía, y el JSON no lo llevaba). Ahora: se restaura al recargar, se exporta como `_codigo`, al importar se respeta si viene y se genera (DDMMAA-R, `codigoAuto()`) si no; en el panel, código vacío = automático (se regenera al cambiar fecha o rama); «Restablecer» lo vuelve a «—».
Verificado con `_herramientas/verificar.mjs` (0 errores, I.L. 181/197/143/0, import/export/recarga, PDF 6 páginas; el hash del JSON exportado cambia porque ahora trae `_codigo`) y con pruebas del panel: rama → Tropa cambia colores, unidad y código; fechas → texto, multi-día y código; Deshacer revierte paso a paso; código manual y vuelta a automático; JSON con código propio respetado; 1000 px y 360 px sin scroll horizontal.

### ✅ P5 — Índice de secciones con progreso (hecho 2026-09-24)
- **Objetivo:** índice lateral de secciones con estado **✓ / ⚠ / vacío**, y en cada sección vacía un botón claro («+ Agregar objetivo», «+ Agregar momento», «+ Elegir indicadores»…).
- **Terminado cuando:** el estado se actualiza al editar; clic en el índice lleva a la sección; los botones abren la acción correcta.
- **Prompt sugerido:**
  > Paso P5 de docs/00-PLAN.md. Agrega un índice lateral de secciones con estado ✓/⚠/vacío calculado desde el estado actual (reusa syncEmpty) y botones claros en secciones vacías. Archivos js/indice.js y css/indice.css + ediciones puntuales. Verifica con navegador headless.

Vista «📋 Secciones» del panel derecho (desde la barra lateral, la hoja «Más» o el contador `n/12` del header): 12 secciones con ✓ / ⚠ (ej. «Falta fecha», «2 sin actividad o duración») / vacío, barra de progreso, clic → va a la sección con un destello, y botón de acción en las que faltan. En la ficha, cada sección de texto vacía muestra un botón claro («+ Agregar objetivo general»…) que activa el modo edición y pone el cursor ahí (no se imprime y se esconde mientras se edita). Un `MutationObserver` sobre la ficha recalcula todo solo (no hizo falta tocar `syncEmpty`).

### ✅ P6 — Selector de I.L. y ODS mejorados (hecho 2026-09-24)
- **Objetivo:** selector de I.L. con buscador (sin acentos), filtros por **área** y **etapa**, contador y **chips** de lo elegido; ODS con mejor contraste e íconos.
- **Terminado cuando:** buscar «nutricion» encuentra «nutrición»; filtros combinables; los chips se quitan con un clic; los ODS pasan contraste AA.
- **Prompt sugerido:**
  > Paso P6 de docs/00-PLAN.md. Mejora el modal de Indicadores de Logro (buscador sin acentos, filtros por área y etapa, contador, chips de seleccionados) y los ODS (contraste AA, íconos). No cambies los textos de INDICADORES. Verifica Manada, Tropa y Clan con navegador headless.

Buscador sin acentos ni mayúsculas y por varias palabras («clasificacion» encuentra «clasificación»; ningún I.L. contiene «nutrición», así que ese ejemplo del plan no aplica a los datos), filtros combinables de área y etapa, contador «n seleccionados · x de y visibles», chips que se quitan con un clic, conteo por área y marca «en la ficha». El pie del modal queda siempre visible. ODS: ícono por ODS; los elegidos con su color oficial y texto blanco o casi negro según cuál pase AA (medido 5,9–6,1); los no elegidos en blanco con borde de color (11,8). Textos de `INDICADORES` sin cambios (181/197/143).
**Arreglo de paso:** `.pages-wrap` nunca se cerraba en `index.html`, así que los modales (y los scripts) quedaban dentro y en el celular heredaban el `zoom` de la ficha (se veían diminutos). Ahora se cierra después de `fichaWrap`.

### ✅ P7 — «Exportar» solo con contenido (hecho 2026-09-24)
- **Objetivo:** los botones de exportar (JSON y PDF) solo se muestran/habilitan si la ficha tiene contenido.
- **Prompt sugerido:**
  > Paso P7 de docs/00-PLAN.md. Muestra los botones de Exportar (JSON/PDF) solo si la ficha tiene contenido (nombre de actividad o al menos un momento/objetivo); actualiza en vivo. Edición puntual en js/ y la barra. Verifica con navegador headless.

Los 4 botones (📄 Exportar PDF del header, PDF de la barra inferior, «Exportar datos» de la barra lateral y de «Más») llevan `data-requiere-contenido`: se deshabilitan (con explicación al pasar el mouse) si no hay nombre de actividad, momento con actividad ni objetivo general/específicos, y se habilitan al instante al escribir. Se prefirió deshabilitar a ocultar para que el header no salte.

### ✅ P8 — Programas como biblioteca (hecho 2026-09-24)
- **Objetivo:** `programas.html` pasa a ser una **biblioteca**: tarjetas por rama con sus colores, filtros y **vista calendario**.
- **Fuentes de datos:**
  1. JSON del repo en `programas/`, listados en un **manifiesto `programas/index.json`** (GitHub Pages no lista carpetas).
  2. **Biblioteca local** en `localStorage`: guardar varios programas, renombrar, duplicar, borrar, exportar/importar la biblioteca completa. Manejar el límite de ~5 MB (medir el tamaño, avisar antes de llenarse, sugerir exportar).
- **Terminado cuando:** funciona sin backend; abrir un programa lo carga en la Ficha; el manifiesto se valida (todas sus rutas existen); con la cuota llena no se pierde nada.
- **Prompt sugerido:**
  > Paso P8 de docs/00-PLAN.md. Rehaz programas.html como biblioteca sin backend: (1) lee programas/index.json (créalo con título, rama, fecha y ruta de cada JSON actual) y (2) una biblioteca local en localStorage con guardar/renombrar/duplicar/borrar/exportar/importar y control del límite de ~5 MB. Tarjetas por rama con colores, filtros y vista calendario. Mantén el bloque de nube detrás de SCOUT_CONFIG.nube. Verifica con navegador headless.

`programas/index.json` lo genera y valida `_herramientas/manifiesto.py` (título, rama —de `_rama` o de «Unidad»—, fechas, n.º de momentos, ruta; `--verificar` comprueba que cada ruta exista, sea una ficha y que no falte ninguna). «Mi biblioteca» (`js/biblioteca-datos.js`) guarda en `localStorage` bajo `biblio_programas` (fuera de `sf_*`: «Restablecer» no la borra). `programas.html` junta ambas fuentes: pestañas por rama con conteo, búsqueda sin acentos, filtro de origen, tarjetas con color de rama y vista calendario mensual (lunes primero; cada programa en sus días). En tarjetas locales: renombrar en línea, duplicar, descargar y borrar (con confirmación); en las del grupo: copiar a mi biblioteca y descargar. Exportar/importar la biblioteca completa (también acepta una ficha suelta; si un id ya existe gana el guardado más reciente, reimportar no duplica). Uso de espacio con barra y aviso al 80 % (Chrome da ~5 M caracteres; se mide en caracteres). En la Ficha: «💾 Guardar en biblioteca» (actualiza el mismo elemento gracias a `sf_biblio_id`) y «Abrir en la ficha» (`index.html?abrir=…`) que antes guarda sola la ficha actual en la biblioteca y pide confirmación; los del grupo se abren como copia. `doImportJSON` se separó en `importarDatos` y `doReset` en `limpiarFicha`. Si el JSON no trae `_rama`, se toma de «Unidad».
Verificado: 9 programas del grupo, búsqueda «nutricion» → 3, calendario, abrir, guardar ×2 = 1 elemento, «Restablecer» conserva la biblioteca, renombrar/duplicar/borrar, exportar e importar en navegador limpio, y con `localStorage` lleno al 100 %: no guarda, lo avisa y no se pierde nada.

### ✅ P9 — Corregir las erratas de I.L. en la app (hecho 2026-09-24)
- **Objetivo:** aplicar en `INDICADORES` los 17 textos de la tabla «Erratas del Excel y versión corregida» de [indicadores-de-logro.md](indicadores-de-logro.md) y actualizar los `_ind` de `programas/**/*.json` que los usen. **El Excel no se toca.**
- **Terminado cuando:** los 17 textos coinciden con la columna «Versión corregida»; un script compara y da 0 diferencias; los programas viejos siguen mostrando sus I.L. (mapear texto viejo → nuevo al importar).
- **Prompt sugerido:**
  > Paso P9 de docs/00-PLAN.md. Aplica en INDICADORES (index.html o js/datos-il.js) las 17 correcciones de la tabla «Erratas del Excel y versión corregida» de docs/indicadores-de-logro.md, con un script Python que reemplace texto exacto y reporte. Actualiza los _ind de programas/**/*.json afectados y agrega un mapa texto-viejo→nuevo al importar JSON. No toques el Excel. Verifica con navegador headless.

`_herramientas/erratas_il.py` lee la tabla directamente del `.md`, comprueba que cada texto esté en la rama/área/etapa de su código y reemplaza por texto exacto (sin reformatear): 17 corregidos en `js/datos-il.js`, 2 programas (`2026-07-25`, `2026-09-05`) con 1 I.L. cada uno, y escribe el mapa `IL_ERRATAS`. `corregirIL()` lo aplica al importar un JSON y al cargar una ficha guardada en el navegador. `--verificar`: 0 diferencias; I.L. siguen en 181/197/143. El Excel no se tocó.

### ✅ P10 — Accesibilidad, contraste y PDF A4 (hecho 2026-09-24)
- **Objetivo:** foco visible, navegación con teclado, `aria-*` en modales, contraste AA, y PDF A4 sin cortes (márgenes, saltos de página, fuentes).
- **Prompt sugerido:**
  > Paso P10 de docs/00-PLAN.md. Revisa accesibilidad (teclado, foco, aria en modales y barras), contraste AA y la impresión A4 (saltos, márgenes). Corrige con ediciones puntuales y genera un PDF de prueba con navegador headless para revisarlo.

**Accesibilidad:** auditoría con axe-core (`_herramientas/accesibilidad.mjs`, 9 escenarios) → de 19–21 problemas de contraste y 4–12 campos sin nombre a **0**. Contraste: botones Editar/PDF, grises de los paneles, pista «Campos editables», colores de área (Afectividad, Creatividad, Corporalidad), etapas E1/E2 con el tono oscuro de la rama (`--cm-dk`), días fuera de mes del calendario; en `2026-05-17.json` (contenido de Tico) los encabezados blanco sobre dorado pasan a texto casi negro y una nota #888 → #666. Teclado y lector (`js/accesibilidad.js` + ediciones puntuales): foco visible, «Saltar a la ficha», foco que entra y vuelve en modales y panel derecho, foco atrapado en el modal, Escape, ODS y grupos de I.L. con Enter/Espacio y `aria-expanded`/`aria-pressed`, diálogos con `role=dialog`/`aria-labelledby`, campos editables con nombre y solo lectura fuera del modo edición, estado con `role=status`, textos de la barra contraída ocultos solo a la vista.
**Impresión:** el PDF del script de verificación se generaba con media `screen` (no era lo que se imprime); ahora se genera con `print` en Carta y en A4. La ficha está diseñada en **Carta** (`@page letter`); en A4 Chrome la ajusta al ancho sin cortes (6 hojas en ambos). Arreglos: (1) las páginas extra se partían solo por `<h4>` y sumando alturas sin márgenes → «Instrucciones de juegos» se desbordaba a una hoja sin encabezado; ahora parte por cualquier título o bloque usando la posición real; (2) la sección del programa tenía `page-break-inside: avoid`: si no cabía, dejaba la hoja 2 vacía con solo el encabezado; ahora se parte entre filas (sin cortar filas) y repite el encabezado de la tabla.


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
