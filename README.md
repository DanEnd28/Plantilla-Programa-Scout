# ⚜️ Ficha Técnica Scout — Grupo Scout La Salle Guaparo

Plantilla web para planificar y exportar la **Ficha Técnica** de los programas de las unidades (Manada, Tropa, Comunidad y Clan) del Grupo Scout La Salle Guaparo, Asociación de Scouts de Venezuela (ASV): datos de la actividad, objetivos, **Indicadores de Logro (I.L.)**, ODS, cronograma por momentos y exportación a PDF/JSON.

- 🌐 **Sitio publicado (GitHub Pages):** https://danend28.github.io/Plantilla-Programa-Scout/
- 🧩 **Tecnología:** HTML + CSS + JavaScript vanilla. Sin backend ni base de datos: cada ficha se guarda en el `localStorage` del navegador y se comparte exportando el JSON.
- 🤖 **Tico:** el Gem de Gemini del grupo arma un programa y entrega un JSON que se importa en la Ficha (botón «Importar»).

## Correrlo en local

```bash
cd plantilla-programa-scout
python3 -m http.server 8000
# abrir http://localhost:8000/
```

No hace falta `npm install` para usar el sitio. (`package.json` de la raíz solo tiene `sharp`, una herramienta opcional para procesar imágenes.)

## Mapa de carpetas

| Ruta | Qué hay |
|---|---|
| `index.html` | La Ficha Técnica (solo HTML, ~550 líneas; estilos y lógica en `css/` y `js/` desde el paso P1) |
| `programas.html` | Página «Programas». Hoy muestra un aviso (la biblioteca compartida llega en el paso P8) y el acceso 🐺 a la Promesa y Ley de la Manada |
| `ayuda.html` | Ayuda de uso |
| `promesa-ley-manada.html` | Promesa y Ley de la Manada (página independiente) |
| `css/` | `base.css` (paletas por rama), `barra.css` (barra, drawer, .fab), `ficha.css` (páginas de la ficha), `modales.css` (modales, ayuda, tooltips), `impresion.css` (PDF); `programas.css` para `programas.html` |
| `js/config.js` | ⚙️ Configuración del sitio: `SCOUT_CONFIG.nube = false` (nube apagada) |
| `js/dialogo.js` | Diálogos propios (reemplazo de `alert`/`confirm`) |
| `js/nube.js` | Cliente de la nube (Neon). **Desactivado** por `js/config.js` |
| `js/datos-il.js` … `js/principal.js` | Lógica de la Ficha, en orden de carga: `datos-il` (I.L. y ODS), `estado` (localStorage), `ficha` (render), `edicion`, `exportar` (JSON/PDF), `ui` (modales, móvil), `principal` (arranque). Detalle en [CLAUDE.md](CLAUDE.md) |
| `js/programas.js` | Lógica de `programas.html` |
| `images/` | Logos del grupo y de cada rama |
| `programas/` | Programas ya hechos en JSON (se pueden importar en la Ficha) y `convocatorias.md` |
| `docs/` | Documentación (ver abajo) |
| `_futuro/nube-neon/` | Backend archivado (Vercel Functions + Neon) para la Versión 2. **No se publica** |
| `_archivo/` | Versiones viejas (`v1.html`). **No se publica** |

> Las carpetas que empiezan con `_` no las publica GitHub Pages (Jekyll las excluye por defecto). No hay `.nojekyll` en el repo; si alguien lo agrega, esas carpetas **sí** quedarían públicas en el sitio.

## Documentación

- 🤝 [CLAUDE.md](CLAUDE.md) — resumen para Claude Code (estado, decisiones, convenciones, cómo verificar).
- 🔁 [docs/HANDOFF.md](docs/HANDOFF.md) — continuidad: historial, cómo exportar el proyecto y prompt para arrancar una sesión nueva.
- 🗺️ [docs/00-PLAN.md](docs/00-PLAN.md) — plan por pasos cortos (Versión 1 GitHub Pages y Versión 2 futura), con el prompt sugerido para cada paso.
- 📌 [docs/00-PENDIENTES.md](docs/00-PENDIENTES.md) — pendientes, estado y decisiones tomadas.
- 📊 [docs/indicadores-de-logro.md](docs/indicadores-de-logro.md) — los 521 I.L. oficiales (Manada, Tropa, Clan) y las erratas corregidas.
- 🗃️ [docs/bd-futura/](docs/bd-futura/00-INDICE.md) — diseño de la base de datos futura (jóvenes, adultos, Informe Previo).
- 🧭 [docs/guias/](docs/guias/) — hosting, Vercel y Next.js + NestJS (online gratis o servidor propio).
- 🔄 [docs/migracion/plan-migracion-por-pasos.md](docs/migracion/plan-migracion-por-pasos.md) — de vanilla a Next.js + NestJS.
- 📩 [docs/n8n/](docs/n8n/COMO-INSTALAR.md) — workflow de aviso por correo cuando se guarda un programa.

## Privacidad

El repositorio es **público**. Nunca se suben datos personales reales (cédulas, teléfonos, correos, nombres de jóvenes o representantes) ni los Excel oficiales. Los ejemplos de `docs/bd-futura/` son inventados.
