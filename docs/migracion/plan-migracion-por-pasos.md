# 🔄 Plan de migración por pasos: vanilla → Next.js + NestJS

> **Estado: solo documentación, nada construido.** Se empieza cuando termine la Versión 1 (P1–P10 de [00-PLAN.md](../00-PLAN.md)). Actualizado: 2026-09-23.

## Idea general

Migrar **de a poco**, con el sitio funcionando en cada paso. Nunca un «reescribir todo»: cada paso deja algo desplegable y verificable.

```
vanilla (P1: css/ + js/ clásicos)
  → M1 módulos ES
  → M2 (opcional) Vite
  → M3 componentes (funciones de render puras)
  → M4 monorepo pnpm + packages/shared (I.L., ODS, tipos)
  → M5 Next.js (apps/web) con los mismos componentes
  → M6 NestJS (apps/api) + PostgreSQL
  → M7 cuentas de dirigentes, biblioteca en la nube, aviso n8n desde el servidor
  → M8 jóvenes, adultos, Informe Previo (según docs/bd-futura/)
```

## 💡 Consejos para ahorrar tokens

- **Sesiones cortas:** un paso (o medio paso) por sesión. Al terminar: commit y `/clear`.
- **Un archivo a la vez:** pide «mueve la función X de A a B», no «refactoriza todo».
- **Da el contexto justo:** nombra los archivos exactos; evita «lee todo el repo».
- **No pegues archivos grandes** en el chat: Claude los lee por rangos.
- **Scripts para cambios repetitivos** (Python/Node que reemplazan y reportan) en vez de editar 50 veces a mano.
- **Verificación fija al final** de cada paso: servidor local + navegador headless + consola sin errores.
- Anota cada paso terminado en [00-PENDIENTES.md](../00-PENDIENTES.md) para no tener que redescubrir el estado.

---

## M1 — Módulos ES

- **Objetivo:** convertir los `js/*.js` de P1 en módulos (`import`/`export`) con un solo `<script type="module" src="js/principal.js">`.
- **Riesgo:** medio. Los `onclick="…"` del HTML necesitan funciones globales; en módulos no lo son. Solución: `addEventListener` o exponer a `window` solo lo necesario durante la transición.
- **Terminado cuando:** no quedan variables globales implícitas; todo funciona igual; GitHub Pages lo sirve sin build.
- **Prompt sugerido:**
  > Paso M1 de docs/migracion/plan-migracion-por-pasos.md. Convierte js/<ARCHIVO>.js en módulo ES (export de sus funciones) e impórtalo desde js/principal.js. Reemplaza los onclick del HTML que lo usan por addEventListener, o expón temporalmente en window solo lo necesario. Un archivo por sesión. Verifica con python3 -m http.server + navegador headless.

## M2 — Vite (opcional)

- **Objetivo:** servidor de desarrollo con recarga y build optimizado; `vite build` → `dist/` publicado con GitHub Actions a Pages.
- **Riesgo:** bajo-medio. Cambia el despliegue (ya no es «subir y listo»). Si no aporta, **saltarlo**: Next.js trae su propio bundler.
- **Terminado cuando:** `pnpm dev` y `pnpm build` funcionan; el workflow de Actions publica `dist/`; rutas de `images/` y `programas/` correctas (usar `base: '/Plantilla-Programa-Scout/'`).
- **Prompt sugerido:**
  > Paso M2. Agrega Vite al proyecto sin cambiar el código de la app: package.json con pnpm, vite.config.js con base '/Plantilla-Programa-Scout/', copia de images/ y programas/ a public/, y un workflow .github/workflows/pages.yml que publique dist/. No hagas push.

## M3 — Componentes (render puro)

- **Objetivo:** que cada parte de la ficha sea una función `render(estado) → HTML` sin efectos (cabecera, objetivos, I.L., ODS, cronograma, página extra). El estado vive en un solo objeto (`estado.js`) con `get/set/suscribir`.
- **Riesgo:** medio. Es el paso que más ayuda a Next.js: cada función será casi 1:1 un componente React.
- **Terminado cuando:** ninguna función de render toca `localStorage` ni `document` fuera de su contenedor; existe `exportar(estado)` / `importar(json)` testeable.
- **Prompt sugerido:**
  > Paso M3. Extrae el render de la sección <SECCIÓN> a una función pura renderX(estado) en js/componentes/x.js; el estado se lee de js/estado.js. No cambies el HTML resultante (compara antes/después con el navegador headless).

## M4 — Monorepo pnpm y `packages/shared`

- **Objetivo:** estructura final:
  ```
  apps/web      (hoy: el sitio vanilla; luego Next.js)
  apps/api      (NestJS, vacío al inicio)
  packages/shared  (I.L., ODS, ramas, tipos y validación del JSON del programa)
  ```
- **Clave:** los **I.L.** (521 textos ya corregidos en P9), `ODS_LIST`, ramas, colores y el **esquema del JSON del programa** (Zod) pasan a `packages/shared`, para que web y api usen exactamente lo mismo.
- **Riesgo:** medio. GitHub Pages necesita build (Actions) desde aquí.
- **Terminado cuando:** `pnpm -r build` pasa; web importa I.L. desde `@scout/shared`; un test verifica 181/197/143 indicadores.
- **Prompt sugerido:**
  > Paso M4. Crea un monorepo pnpm (pnpm-workspace.yaml) moviendo el sitio a apps/web y creando packages/shared con INDICADORES, ODS_LIST, ramas y un esquema Zod del JSON del programa. Agrega un test que cuente 181/197/143 I.L. No crees apps/api todavía salvo un README.

## M5 — Next.js en `apps/web`

- **Objetivo:** Next.js (App Router) con las mismas pantallas: Ficha, Programas, Ayuda. Primero **export estático** (`output: 'export'`) para seguir en GitHub Pages o Vercel sin servidor.
- **Orden recomendado:** Ayuda (simple) → Programas (biblioteca local) → Ficha (por componentes de M3, uno por sesión) → PDF.
- **Riesgo:** alto en la Ficha (edición en vivo, `contenteditable`, arrastrar momentos, impresión A4). Mantener la versión vanilla publicada hasta que la nueva esté igual o mejor.
- **Terminado cuando:** un JSON exportado desde la vanilla se importa en Next y se ve igual; el PDF A4 coincide.
- **Prompt sugerido:**
  > Paso M5 (<PANTALLA>). En apps/web (Next.js App Router, output export) crea la pantalla <PANTALLA> usando @scout/shared y portando los componentes de M3 como componentes React client. Sin backend. Verifica importando programas/2026-09-19.json.

## M6 — NestJS en `apps/api` + PostgreSQL

- **Objetivo:** API con módulos `programas` (CRUD + versiones, como `_futuro/nube-neon/api/`), `salud` y luego `auth`. ORM a elegir (ver [guías](../guias/03-nextjs-nestjs-online-gratis.md)). Esquema inicial = `_futuro/nube-neon/db/schema.sql`.
- **Riesgo:** medio. Reusar la lógica ya probada de `_futuro/nube-neon/api/_lib/` (hash canónico, versiones, duplicados).
- **Terminado cuando:** los endpoints equivalen a los de `DB-SETUP.md`; `scripts/migrar-programas` sube los JSON de `programas/`; la web guarda y abre programas desde la API.
- **Prompt sugerido:**
  > Paso M6. Crea apps/api con NestJS: módulo programas (listar, crear, versionar, abrir versión) portando la lógica de _futuro/nube-neon/api/_lib/, validando con el esquema de @scout/shared. PostgreSQL local con docker compose. Tests e2e básicos. Sin auth todavía.

## M7 — Cuentas, biblioteca en la nube y aviso n8n

- **Objetivo:** login de **dirigentes** (los adultos del formato IP), permisos por rama, «Guardar definitivo» que versiona en la API y **el servidor** llama al webhook n8n ([n8n/COMO-INSTALAR.md](../n8n/COMO-INSTALAR.md), opción b).
- **Terminado cuando:** un programa guardado por un dirigente queda «verificado»; el aviso llega por correo; el secreto del webhook solo está en variables del servidor.

## M8 — Jóvenes, adultos e Informe Previo

- **Objetivo:** implementar [bd-futura/](../bd-futura/00-INDICE.md): registros de jóvenes y adultos (datos de menores: permisos estrictos, cifrado de campos sensibles, auditoría), e IP generado desde el programa (IP grupal marcado «Grupal»). Sin plazos de borrado, solo actualización (decisión de Danny).
- **Riesgo:** alto (datos personales de menores). Nunca datos reales en el repo; pruebas con datos sintéticos.
