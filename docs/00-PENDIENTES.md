# 📌 Pendientes y decisiones

> Lista única. Actualizado: 2026-09-23. El plan paso a paso está en [00-PLAN.md](00-PLAN.md).
> Estados: ✅ hecho · 🟡 en curso / parcial · ⏳ pendiente · ❓ por decidir · 💤 congelado (Versión 2)

## Pendientes

| Tema | Estado | Dónde está | Qué falta |
|---|---|---|---|
| Orden de carpetas (P0) | ✅ | raíz, `_futuro/`, `_archivo/`, `docs/` | Hacer commit y push (lo hace Danny) |
| I.L. Manada, Tropa y Clan cargados | ✅ | `index.html` (`INDICADORES`, `IND_BASE`) · [indicadores-de-logro.md](indicadores-de-logro.md) | — (181 + 197 + 143 = 521, verificado en navegador) |
| Erratas del Excel en I.L. (17) | ✅ | [indicadores-de-logro.md](indicadores-de-logro.md#erratas-del-excel-y-versión-corregida) | Aplicadas en la app y en `programas/**/*.json` en **P9** |
| I.L. de Comunidad | ⏳ | — | La ASV/Excel aún no los tiene. No inventar; esperar la fuente oficial |
| Nube (Neon) desactivada | ✅ | `js/config.js` (`nube: false`), `js/nube.js`, `_futuro/nube-neon/` | Reactivar en V2 |
| `ayuda.html` actualizada | ✅ 2026-09-24 | `ayuda.html` | Reescrita a pedido de Danny: pantalla (barra lateral, header, panel derecho, móvil), menú, Configuración, Programa, Secciones, campos, I.L., ODS, biblioteca, PDF, Tico, páginas extra y teclado. Se quitaron la nube, «Guardar HTML», «Separar día» y la hora manual |
| `v1.html` archivada | ✅ | `_archivo/v1.html` | Tras el push, la URL pública `…/v1.html` dará 404 (nadie la enlazaba) |
| Dividir `index.html` (P1) | ✅ | `css/*.css`, `js/*.js` (ver [../CLAUDE.md](../CLAUDE.md)) | — (verificado antes/después con navegador headless: idéntico) |
| «Guardar HTML» (botón 💾) | ✅ eliminado 2026-09-23 | — | Decisión de Danny: Exportar JSON ya lo cubre. En «Restablecer», la opción de guardar antes de limpiar ahora exporta JSON (`rst-json`) |
| Claves READ/EDIT/ADMIN | ⏸️ no necesarias por ahora | `_futuro/nube-neon/.env.local` | Generadas pero sin uso hasta reactivar la nube |
| Script de verificación headless | ✅ | `_herramientas/verificar.mjs` | Ver cabecera del archivo para usarlo |
| Acceso a Promesa y Ley de la Manada | ✅ | `programas.html` (bajo las pestañas, en «Todas» y «Manada») | — |
| Pestaña elegida no se resalta en Programas | ✅ | `js/biblioteca.js` | Resuelto con la biblioteca nueva (P8); el bloque de la nube solo se carga con `SCOUT_CONFIG.nube`
| Claves de la nube (local) | ✅ | `_futuro/nube-neon/.env.local` (ignorado por git) | En producción van en las variables de entorno de Vercel |
| Barra lateral / superior / móvil | ✅ | `css/barra.css`, `js/ui.js` (`toggleSidebar`, `toggleMoreMenu`, `toggleBottomSheet`), `index.html` | — (verificado: escritorio con barra lateral retráctil, móvil con barra inferior + hoja "Más", 0 errores de consola, 360 px sin scroll horizontal, PDF sin barras) |
| «Restablecer» no borraba las páginas extra | ✅ corregido 2026-09-23 | `js/estado.js` → `doReset()` | — (ahora vacía `#extraPagesContainer` y `extraPages`) |
| Asistente de inicio + Tico (P3) | ✅ 2026-09-24 | `js/asistente.js`, `css/asistente.css`, `#mAsistente` | Primero se saltó; Danny lo pidió después. Se reabre desde 🧭 en el menú |
| Configuración en vivo (P4) | ✅ | `js/config-panel.js`, `css/panel.css`, `index.html` (`#cfgPanel`) | — (panel derecho, una sola vista, en vivo, con Deshacer; modo edición se mantiene) |
| Programa en el panel derecho + días automáticos | ✅ | `js/programa-panel.js`, `js/ficha.js` (programa) | — (tarjetas en tiempo real; sin «Separar día») |
| Código (se perdía al recargar, no se exportaba ni se generaba al importar) | ✅ corregido 2026-09-23 | `js/edicion.js` (`codigoAuto`), `js/exportar.js` (`_codigo`), `js/estado.js` (`loadStorage`, `doReset`) | — |
| Índice con progreso (P5) | ✅ | `js/indice.js`, `css/indice.css` | — |
| Selector I.L. y ODS (P6) | ✅ | `js/selector-il.js`, `css/modales.css`, `renderODS` en `js/ficha.js` | — |
| Exportar solo con contenido (P7) | ✅ | `js/exportar.js` (`exportarActualizar`), `[data-requiere-contenido]` | — |
| Modales diminutos en el celular (`.pages-wrap` sin cerrar) | ✅ corregido 2026-09-24 | `index.html` | — |
| Biblioteca de programas (P8) | ✅ | `programas.html`, `js/biblioteca*.js`, `programas/index.json` | Regenerar el manifiesto con `_herramientas/manifiesto.py` al agregar programas |
| Erratas de I.L. en la app (P9) | ✅ | `js/datos-il.js` (`IL_ERRATAS`), `_herramientas/erratas_il.py` | — |
| Accesibilidad y PDF (P10) | ✅ | `js/accesibilidad.js`, `_herramientas/accesibilidad.mjs`, `css/impresion.css` | — (axe 0 problemas; Carta y A4 sin hojas vacías) |
| ¿Carta o A4? | ❓ | `css/impresion.css` (`@page letter`), `--page-w: 8.5in` | La ficha está diseñada en **Carta** (lo usual en Venezuela); en A4 se imprime ajustada al ancho, sin cortes. Pasarla a A4 nativo es un cambio de diseño: decidir |
| Skill de Claude `tico-scout` | ✅ 2026-09-24 | `~/.claude/skills/tico-scout/` (respaldo en `~/.claude/skills-respaldos/tico-scout-2026-09-24`) | I.L. de Manada y Tropa alineados al listado oficial (29 textos; lista en [indicadores-de-logro.md](indicadores-de-logro.md)); JSON con `_rama`, `_hora_ini`/`_hora_cierre`, varios días con `dia`/`_horas_dia`, sin `_codigo`; colores AA y juegos en bloques partibles. El prompt del Gem (`tico-prompt-gemini.md`) recibió lo mismo: **pegarlo en el Gem de Gemini** para que Tico en Gemini también lo aplique |
| Clan en Tico | 🟡 | skill `tico-scout` → `references/indicadores-clan.md` (regla 21) | ✅ Tiene los 143 I.L. oficiales del Clan (E5/E6). ⏳ No hay reglas de planificación para el Clan: por decisión de Danny, Tico **pregunta** al adulto (tratamiento, horario, lugar, estructura) en vez de usar las de Manada/Tropa. Completar cuando haya reglas. También se corrigió la etapa de Tropa en la skill: `E3`/`E4` (antes decía 1.ª/2.ª y el JSON solo permitía `E1`/`E2`) |
| 29 diferencias de redacción de I.L. (posibles erratas extra) | ❓ | [indicadores-de-logro.md](indicadores-de-logro.md#diferencias-con-la-versión-anterior-de-tico-por-decidir) | Decidir si algunas (sobre todo tildes) se suman a la tabla de erratas |
| Aviso n8n por correo | 🟡 | [n8n/](n8n/COMO-INSTALAR.md) | Importar en una instancia, credenciales, y el botón «Guardar definitivo» en la Ficha |
| Hosting futuro | ❓ | [guias/01-evaluacion-hosting.md](guias/01-evaluacion-hosting.md) | Elegir: online gratis vs. servidor propio (Contabo) |
| Migración Next.js + NestJS | 💤 | [migracion/plan-migracion-por-pasos.md](migracion/plan-migracion-por-pasos.md) | Empezar después de la V1 |
| Bases de jóvenes, adultos e IP | 💤 | [bd-futura/](bd-futura/00-INDICE.md) | V2 |
| `.claude/` y `node_modules/` fuera del repo | ✅ | `.gitignore` | `node_modules/` ya estaba fuera del índice (borrado en *staging*); `.claude/` agregado |
| Datos personales en el repo | ✅ | revisado con grep (cédulas, teléfonos, correos, nombres) | Solo hay ejemplos inventados (`V-00000000`, `0414-0000000`, `@example.com`) y cargos scout (Akela, Bagheera…) |

## 🧭 Registro de decisiones de Danny

| Fecha | Decisión |
|---|---|
| 2026-09-23 | Por ahora, versión **netamente para GitHub Pages**: vanilla HTML/JS/CSS, **sin base de datos, sin backend y sin nada de IP** (Informe Previo). Más adelante se migra. |
| 2026-09-23 | El backend Vercel + Neon ya hecho **no se usa por ahora**: queda archivado en `_futuro/nube-neon/`. |
| 2026-09-23 | Futuro: **Next.js** (frontend) + **NestJS** (backend). Aún sin decidir si va en **Vercel + servicios online gratis** o en **servidor propio** (VPS Ubuntu, el plan más barato de Contabo). **Solo se documenta, no se construye.** |
| 2026-09-23 | **Sin plazos de borrado de datos**, solo actualización. |
| 2026-09-23 | El **IP grupal** se marca **«Grupal»**. |
| 2026-09-23 | **Comunidad aún no tiene I.L.** |
| 2026-09-23 | Los adultos listados en el formato del IP son los **dirigentes del grupo**, que serán los **usuarios con clave**. |
| 2026-09-23 | **No tocar los Excel.** Las erratas del Excel se corrigen **en la app y en la documentación**, no en el Excel. |
| 2026-09-23 | Excluir del repo **solo los datos personales**, no toda la documentación. |
| 2026-09-23 | **P3 (asistente de inicio) se salta.** |
| 2026-09-23 | Layout estilo GHL: barra lateral de alto completo con logo, header morado arriba a la derecha, contenido abajo a la derecha. |
| 2026-09-23 | P4: panel de configuración a la **derecha**; se **mantiene el modo edición**; el código se respeta si viene en el JSON y se genera si no. |

## ❓ Preguntas abiertas

1. ¿El aviso n8n va en la instancia propia de Danny (n8n.lety.ai) o en una instancia aparte para el grupo?
2. ¿A qué correo(s) debe llegar el aviso (Jefe de Grupo, jefes de unidad)?
3. ¿Hace falta mantener viva la URL `…/v1.html` (por ejemplo, con una página que redirija a la Ficha)?
