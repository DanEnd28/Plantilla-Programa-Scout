# 📌 Pendientes y decisiones

> Lista única. Actualizado: 2026-09-23. El plan paso a paso está en [00-PLAN.md](00-PLAN.md).
> Estados: ✅ hecho · 🟡 en curso / parcial · ⏳ pendiente · ❓ por decidir · 💤 congelado (Versión 2)

## Pendientes

| Tema | Estado | Dónde está | Qué falta |
|---|---|---|---|
| Orden de carpetas (P0) | ✅ | raíz, `_futuro/`, `_archivo/`, `docs/` | Hacer commit y push (lo hace Danny) |
| I.L. Manada, Tropa y Clan cargados | ✅ | `index.html` (`INDICADORES`, `IND_BASE`) · [indicadores-de-logro.md](indicadores-de-logro.md) | — (181 + 197 + 143 = 521, verificado en navegador) |
| Erratas del Excel en I.L. (17) | 🟡 | Documentadas con versión corregida en [indicadores-de-logro.md](indicadores-de-logro.md#erratas-del-excel-y-versión-corregida) | Aplicarlas en el código y en `programas/**/*.json` → **P9** |
| I.L. de Comunidad | ⏳ | — | La ASV/Excel aún no los tiene. No inventar; esperar la fuente oficial |
| Nube (Neon) desactivada | ✅ | `js/config.js` (`nube: false`), `js/nube.js`, `_futuro/nube-neon/` | Reactivar en V2 |
| `ayuda.html` habla de «Guardar en la nube» y de Programas en la nube | ⏳ | `ayuda.html` (sección «Guardar en la nube») | Actualizar el texto cuando se haga P2/P8 (no se tocó para no mezclar cambios) |
| `v1.html` archivada | ✅ | `_archivo/v1.html` | Tras el push, la URL pública `…/v1.html` dará 404 (nadie la enlazaba) |
| Dividir `index.html` (P1) | ✅ | `css/*.css`, `js/*.js` (ver [../CLAUDE.md](../CLAUDE.md)) | — (verificado antes/después con navegador headless: idéntico) |
| «Guardar HTML» (botón 💾) | ✅ eliminado 2026-09-23 | — | Decisión de Danny: Exportar JSON ya lo cubre. En «Restablecer», la opción de guardar antes de limpiar ahora exporta JSON (`rst-json`) |
| Claves READ/EDIT/ADMIN | ⏸️ no necesarias por ahora | `_futuro/nube-neon/.env.local` | Generadas pero sin uso hasta reactivar la nube |
| Script de verificación headless | ✅ | `_herramientas/verificar.mjs` | Ver cabecera del archivo para usarlo |
| Acceso a Promesa y Ley de la Manada | ✅ | `programas.html` (bajo las pestañas, en «Todas» y «Manada») | — |
| Pestaña elegida no se resalta en Programas | ⏳ | `js/programas.js` → `cargar()` | Con la nube apagada, `cargar()` sale antes de `pintarTabs()`. Se resuelve en **P8** (biblioteca)
| Claves de la nube (local) | ✅ | `_futuro/nube-neon/.env.local` (ignorado por git) | En producción van en las variables de entorno de Vercel |
| Barra lateral / superior / móvil | ✅ | `css/barra.css`, `js/ui.js` (`toggleSidebar`, `toggleMoreMenu`, `toggleBottomSheet`), `index.html` | — (verificado: escritorio con barra lateral retráctil, móvil con barra inferior + hoja "Más", 0 errores de consola, 360 px sin scroll horizontal, PDF sin barras) |
| «Restablecer» no borraba las páginas extra | ✅ corregido 2026-09-23 | `js/estado.js` → `doReset()` | — (ahora vacía `#extraPagesContainer` y `extraPages`) |
| Asistente de inicio + Tico | ⏭️ saltado | — | Danny decidió no hacerlo (2026-09-23) |
| Configuración en vivo (P4) | ✅ | `js/config-panel.js`, `css/panel.css`, `index.html` (`#cfgPanel`) | — (panel derecho, una sola vista, en vivo, con Deshacer; modo edición se mantiene) |
| Programa en el panel derecho + días automáticos | ✅ | `js/programa-panel.js`, `js/ficha.js` (programa) | — (tarjetas en tiempo real; sin «Separar día») |
| `ayuda.html` menciona «Separar día» y el modal de agregar momento | ⏳ | `ayuda.html` | Actualizar el texto cuando Danny lo pida (regla: no tocar `ayuda.html` sin pedido) |
| Código (se perdía al recargar, no se exportaba ni se generaba al importar) | ✅ corregido 2026-09-23 | `js/edicion.js` (`codigoAuto`), `js/exportar.js` (`_codigo`), `js/estado.js` (`loadStorage`, `doReset`) | — |
| Índice con progreso | ⏳ | — | **P5** |
| Selector I.L. y ODS | ⏳ | modal `mInd`, `ODS_LIST` | **P6** |
| Exportar solo con contenido | ⏳ | barra | **P7** |
| Biblioteca de programas | ⏳ | `programas.html` (hoy muestra aviso), `programas/` | **P8** (manifiesto `programas/index.json` + biblioteca local) |
| Accesibilidad y PDF A4 | ⏳ | — | **P10** |
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
