# 🔁 Handoff — continuidad del proyecto

> Para que otra persona u otra sesión de Claude siga el trabajo **sin la memoria de las conversaciones anteriores**. Resumen corto y reglas: [../CLAUDE.md](../CLAUDE.md). Actualizado: 2026-09-23.

## 1. Historial resumido (por sesiones)

| # | Sesión | Qué se hizo | Dónde quedó |
|---|---|---|---|
| 1 | **Nube Neon** | Backend en Vercel Functions + PostgreSQL (Neon): tablas `programas` y `programa_versiones`, versiones con autor/verificación, claves `READ_KEY`/`EDIT_KEY`/`ADMIN_KEY`, cliente `js/nube.js` y `programas.html` con lista, historial y modo admin | Archivado en `_futuro/nube-neon/` (ver su `LEEME.md`). Apagado con `SCOUT_CONFIG.nube = false` |
| 2 | **I.L. corregidos y Clan cargado** | I.L. oficiales de Manada (181), Tropa (197) y Clan (143) = 521, tomados del IP Waingunga; 17 erratas del Excel documentadas con su versión corregida | `js/datos-il.js` (`INDICADORES`) · [indicadores-de-logro.md](indicadores-de-logro.md). Aplicar las erratas en el código = **P9** |
| 3 | **Documentación de la base futura** | Diseño de las bases de jóvenes, adultos e Informe Previo (IP), con ejemplos inventados | [bd-futura/](bd-futura/00-INDICE.md) |
| 4 | **Reorganización (P0)** | Backend a `_futuro/`, `v1.html` a `_archivo/`, bandera de nube, README, plan por pasos, pendientes, guías de hosting y de migración a Next.js + NestJS, `.gitignore` | Raíz, [00-PLAN.md](00-PLAN.md), [00-PENDIENTES.md](00-PENDIENTES.md), [guias/](guias/), [migracion/](migracion/plan-migracion-por-pasos.md) |
| 5 | **Workflow n8n en JSON** | Aviso por correo cuando se guarda un programa (webhook con secreto, validación, límite, correo HTML, manejo de errores). Validado, **no instalado** en ninguna instancia | [n8n/](n8n/COMO-INSTALAR.md) |
| 6 | **P1 + ajustes** | `index.html` dividido en `css/` y `js/` (y `programas.html` en `css/programas.css` + `js/programas.js`) sin cambiar el comportamiento; acceso 🐺 «Promesa y Ley de la Manada» en `programas.html`; claves locales de la nube generadas en `_futuro/nube-neon/.env.local` y `.gitignore` con `.env*`; este handoff y `CLAUDE.md` | Verificado antes/después con Chromium headless: capturas idénticas píxel a píxel, JSON exportado idéntico, 0 errores |

**Siguiente paso: P2** (barra lateral retráctil, barra superior mínima, barra inferior en móvil). Prompt listo en [00-PLAN.md](00-PLAN.md#p2--barra-lateral-retráctil-y-barra-superior-mínima).

Problemas conocidos: «💾 Guardar HTML» se eliminó (Exportar JSON lo cubre); en la vista de Programas, con la nube apagada, la pestaña elegida no se resalta. Anotado en pendientes para P8.

## 2. Archivos clave

| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | Lo que Claude Code lee solo al abrir la carpeta: estado, decisiones, convenciones, verificación |
| `docs/00-PLAN.md` | Pasos P1–P10 (Versión 1) y V2-1…V2-8, con el prompt de cada uno |
| `docs/00-PENDIENTES.md` | Tabla de pendientes, registro de decisiones y preguntas abiertas |
| `index.html` + `css/*.css` + `js/*.js` | La Ficha (qué hace cada archivo: tabla en `CLAUDE.md`) |
| `js/config.js` | Bandera `SCOUT_CONFIG.nube` |
| `docs/indicadores-de-logro.md` | Los 521 I.L. y las 17 erratas con su corrección |
| `programas/*.json` | Programas reales para importar y probar (`2026-05-17.json` se usa en la verificación) |
| `_futuro/nube-neon/` | Backend de la Versión 2 (`.env.local` con las claves locales, **no** versionado) |
| `../scout-privado/` | Datos personales reales. **Fuera del repo**; no se exporta con el proyecto |

## 3. Cómo exportar el proyecto

Git solo guarda lo que tiene commit, y hoy hay mucho sin commit (P0 y P1). Por eso se exportan **dos cosas**: el historial (bundle) y la copia de trabajo completa (incluye lo no versionado), **sin** `.env*`, `node_modules/` ni `.claude/` (el filtro sale de `.gitignore`).

```bash
cd /home/danend/workspace/other/plantilla-programa-scout
FECHA=$(date +%F)

# 1) Historial de git (todas las ramas y commits)
git bundle create ../scout-historial-$FECHA.bundle --all

# 2) Copia de trabajo: archivos versionados + no versionados, respetando .gitignore
git ls-files -co --exclude-standard | while IFS= read -r f; do [ -e "$f" ] && printf '%s\n' "$f"; done > /tmp/scout-lista.txt
tar -czf ../scout-trabajo-$FECHA.tar.gz -T /tmp/scout-lista.txt

# Comprobar que no se coló ninguna clave (debe salir solo .env.example)
tar -tzf ../scout-trabajo-$FECHA.tar.gz | grep -E '\.env|node_modules|\.claude'
```

(En este equipo no hay `zip`; si se necesita `.zip`: `sudo apt install zip` y `zip ../scout-trabajo-$FECHA.zip -@ < /tmp/scout-lista.txt`.)

Para restaurar en otra máquina:

```bash
git clone scout-historial-AAAA-MM-DD.bundle plantilla-programa-scout
cd plantilla-programa-scout && tar -xzf ../scout-trabajo-AAAA-MM-DD.tar.gz   # encima, trae lo no versionado
```

Las claves de `_futuro/nube-neon/.env.local` se pasan aparte, por un canal privado (o se generan de nuevo con `openssl rand -base64 24`). No hace falta `npm install` para usar el sitio.

## 4. Cómo arrancar una sesión nueva de Claude

**Claude Code** (recomendado): abrir la terminal en la carpeta del proyecto y ejecutar `claude`. `CLAUDE.md` se carga solo. Pegar el prompt de arranque.

**claude.ai** (sin acceso a la carpeta): crear un Proyecto y subir como archivos `CLAUDE.md`, `docs/HANDOFF.md`, `docs/00-PLAN.md`, `docs/00-PENDIENTES.md` y los archivos que toque el paso (para P2: `index.html`, `css/barra.css`, `css/base.css`, `js/ui.js`, `js/edicion.js`). Allí Claude no puede ejecutar el servidor ni el navegador headless: la verificación la hace Danny en su navegador.

**Prompt de arranque (copiar tal cual):**

> Proyecto «Ficha Técnica Scout» (plantilla-programa-scout). Antes de nada lee CLAUDE.md, docs/HANDOFF.md, docs/00-PLAN.md y docs/00-PENDIENTES.md; no tienes la memoria de las sesiones anteriores, todo lo necesario está ahí. Respeta las decisiones de Danny que aparecen en CLAUDE.md (no tocar _archivo/v1.html, ayuda.html ni los Excel; datos personales fuera del repo; sin commit, push ni n8n sin mi confirmación; nunca mostrar ni escribir claves). Todo en español con acentos correctos y ediciones puntuales, sin reescribir archivos grandes. Hoy toca el paso P2 de docs/00-PLAN.md: sigue su prompt sugerido. Antes de cambiar nada guarda una línea base con python3 -m http.server + Chromium headless (errores de consola, I.L. 181/197/143, capturas escritorio y móvil, impresión), repite al final y compara. Al terminar marca P2 como hecho en el plan y en pendientes, y dime qué archivos cambiaste y qué preguntas quedan abiertas.

Para otro paso, cambiar «P2» por el que corresponda.
