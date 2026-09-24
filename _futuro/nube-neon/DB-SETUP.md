# ☁️ Programas en la nube: puesta en marcha

Esto agrega a la plantilla una base de datos Postgres para guardar los programas y abrirlos desde cualquier dispositivo, con historial de versiones, una página por rama (`programas.html`) y un modo administrador para archivar y borrar.

> 👉 **¿Primera vez?** Sigue la guía paso a paso [GUIA-NEON.md](GUIA-NEON.md) (Neon, la opción elegida). Este documento es la referencia técnica.

## Cómo funciona

```
Navegador (index.html + js/nube.js, programas.html)
   │  fetch /api/programas…            ← la DB nunca se toca desde el navegador
   ▼
Vercel Functions (api/programas.js, api/salud.js, código compartido en api/_lib/)
   │  pg (node-postgres)               ← aquí se capturan IP y geo (headers de Vercel)
   ▼
Postgres (Neon vía Vercel Marketplace, o Supabase)
   programas            1 fila por programa (se crea UNA sola vez; archivado_at = archivado)
   programa_versiones   1 fila por guardado (v1, v2…) con hash, autor, verificada y metadata
```

- **Un programa se sube una sola vez.** Guardar cambios crea una nueva versión del mismo programa, no un duplicado.
- **Contenido idéntico = no se guarda de nuevo.** El servidor calcula un SHA-256 del JSON canónico (claves ordenadas). Si esa versión ya existe en el programa responde `sin_cambios`. Si al *crear* ese contenido ya existe en otro programa responde `duplicado` y vincula el borrador a ese programa.
- **Mismo programa creado dos veces.** Si ya existe uno con la misma rama, fecha y nombre, la API responde 409 y la página ofrece guardarlo como nueva versión de ese.
- **Dos personas editando a la vez.** Si guardas partiendo de la v2 y alguien ya guardó la v3, se te avisa y decides si guardar la tuya como v4. La otra queda en el historial.
- **localStorage sigue siendo el borrador.** Todo funciona igual sin internet. La nube es un paso extra (botón **☁️ Guardar**).

## 🔑 Claves y matriz de permisos

Todas las claves son variables de entorno en Vercel. La página las manda en el header `x-clave-grupo`.

| Acción | Sin clave | `READ_KEY` | `EDIT_KEY` | `ADMIN_KEY` |
|---|---|---|---|---|
| Ver lista, abrir programa, historial | ❌ (✅ si `READ_KEY` está vacía) | ✅ | ✅ | ✅ |
| Ver IP y user-agent en el historial | ❌ | ❌ | ✅ | ✅ |
| Guardar (crear / nueva versión) | ✅ **sin verificar** | ✅ **sin verificar** | ✅ **verificada** | ✅ **verificada** |
| Respuesta al guardar | mínima (id, estado, nº de versión) | completa | completa | completa |
| Ver archivados, archivar / desarchivar | ❌ | ❌ | ❌ | ✅ |
| Borrar programa o versión | ❌ | ❌ | ❌ | ✅ |

- **Sin verificar:** la versión se guarda con `verificada = false` y se marca así en el historial y en la tarjeta de `programas.html`.
- **Respuesta mínima:** quien guarda sin poder leer no recibe títulos, autores ni datos de otros programas, solo el id, el estado y el número de versión. Así guardar sin clave no sirve para leer lo que otros subieron.
- **Clave equivocada:** si se envía una clave que no coincide con ninguna, la API responde 401 (`clave_incorrecta`), incluso al guardar. Así un error de tipeo no se guarda en silencio como "sin verificar".
- **Archivar** (soft delete) oculta el programa de la lista y su link deja de abrirse, excepto para el admin. Se puede desarchivar. **Borrar** es definitivo: la UI pide escribir `BORRAR` en un diálogo propio. No se puede borrar la única versión de un programa; para eso se borra el programa.
- El admin entra con **🔐 Admin** en `programas.html`. Su clave se recuerda solo mientras la pestaña esté abierta (`sessionStorage`). Las claves de lectura y edición se recuerdan en el navegador (`localStorage`, `scout_clave`).
- Es una protección con claves compartidas, no un sistema de usuarios. Si una clave se filtra, cámbiala en Vercel y vuelve a desplegar.

**Configuración recomendada para el grupo:** `READ_KEY` con una clave para dirigentes y representantes que solo miran, `EDIT_KEY` con la clave de los dirigentes que programan y `ADMIN_KEY` solo para ti.

## Neon o Supabase

El código funciona con los dos: solo cambia `DATABASE_URL`.

| | **Neon** | **Supabase** |
|---|---|---|
| Integración con Vercel | Nativa en Storage → Marketplace. Crea la DB y las variables de entorno sola, y se factura por Vercel. | También está en el Marketplace de Vercel. Si la creas por fuera, copias la `DATABASE_URL` a mano. |
| Plan gratis | ~0,5 GB por proyecto, sobra para cientos de programas (cada uno pesa ~20 KB por versión). | ~500 MB de base de datos y 2 proyectos activos. |
| Inactividad | El cómputo "se duerme" a los ~5 min sin uso y **despierta solo** en la siguiente petición (el primer guardado tarda un poco más). | El proyecto gratis **se pausa tras ~1 semana sin actividad** y hay que reactivarlo a mano desde el panel. Unas vacaciones escolares bastan para que pase. |
| Panel | Sencillo: SQL Editor, tablas, ramas (branches). | Más completo: editor de tablas tipo hoja de cálculo, SQL, auth, storage (no usamos lo extra). |
| Backups | Historial para restaurar a un momento anterior (en el plan gratis es una ventana corta, de horas). | El plan gratis no incluye backups diarios descargables (son de planes pagos). |

**Elegido: Neon** (guía: [GUIA-NEON.md](GUIA-NEON.md)). Se conecta con dos clics desde Vercel, no se pausa, y el tamaño gratis sobra. Supabase conviene si quieres su panel de tablas o piensas usar sus otros servicios, pero la pausa por inactividad es un riesgo real para un grupo que usa la herramienta por temporadas. En ambos casos haz un respaldo propio de vez en cuando (ver Notas).

> Los límites de los planes gratuitos cambian. Confírmalos en las páginas de precios de Neon y Supabase antes de decidir.

## Rutas de la API

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| GET | `/api/salud` | libre | Estado: ¿hay DB?, ¿qué claves hay configuradas?, rol de la clave enviada |
| GET | `/api/programas?rama=manada&q=texto&limite=100&desde=0` | lectura | Lista (sin contenido) + conteo por rama. `&archivados=1` → solo archivados (admin) |
| POST | `/api/programas` | libre | Crea un programa (v1). Body: `{ contenido, autor, cliente }` |
| GET | `/api/programas/:id` (`?version=N`) | lectura | Programa + contenido de la última versión (o de la N) |
| PUT | `/api/programas/:id` | libre | Nueva versión. Body: `{ contenido, autor, cliente, version_base, forzar? }` |
| PATCH | `/api/programas/:id` | admin | `{ "archivado": true | false }` |
| DELETE | `/api/programas/:id` | admin | Borra el programa y todas sus versiones |
| GET | `/api/programas/:id/versiones` | lectura | Historial (IP y user-agent solo con `EDIT_KEY`/`ADMIN_KEY`) |
| DELETE | `/api/programas/:id/versiones/:n` | admin | Borra una versión. Si era la actual, pasa a serlo la más reciente que quede |

"Libre" significa sin clave, con la versión marcada como sin verificar (ver la matriz). `contenido` usa el mismo formato de **📤 Exportar datos** (`_data`, `_prog`, `_ind`, `_ods`, …), más `_rama`, `_doc_title`, `_hora_ini`, `_hora_cierre` y `_grupal_comunidad`. Las rutas con `:id` se reescriben hacia `api/programas.js` en `vercel.json`.

## Metadata que se guarda por versión

- **Navegador** (la envía `js/nube.js`): user-agent, idioma(s), zona horaria, resolución de pantalla y ventana, densidad de píxeles, plataforma, si es móvil y hora local.
- **Servidor** (solo se puede obtener ahí): IP (`x-forwarded-for`), país, región y ciudad (`x-vercel-ip-country`, `x-vercel-ip-country-region`, `x-vercel-ip-city`), user-agent y hora de recepción.
- **Autor:** nombre opcional que escribe la persona. Se recuerda en `localStorage` como `scout_autor`.

> ⚠️ **Aviso a los usuarios.** La IP y la ubicación son datos personales. El modal de guardado muestra un aviso breve de qué se registra y para qué, y también está en `ayuda.html`. Avísalo igual al grupo. En el historial, país/ciudad y plataforma los ve cualquiera con acceso de lectura; la IP y el user-agent completos, solo `EDIT_KEY` y `ADMIN_KEY`.

---

## Pasos para ponerlo en producción

Resumen técnico. El paso a paso detallado, con comandos de git y errores comunes, está en [GUIA-NEON.md](GUIA-NEON.md).

### 1. Crear la base de datos

**Opción A: Neon desde Vercel (recomendada)**

1. Vercel → proyecto *Plantilla-Programa-Scout* → pestaña **Storage** → **Create Database** → **Neon** → plan Free.
2. Región: la más cercana a tus funciones (por defecto `iad1`, Washington D. C. → Neon `aws-us-east-1`).
3. **Connect Project** con Production, Preview y Development. Vercel crea sola `DATABASE_URL` (y `POSTGRES_URL`, `DATABASE_URL_UNPOOLED`, etc.).

**Opción B: Supabase**

1. Crea el proyecto (desde el Marketplace de Vercel o en supabase.com, región `us-east-1` si puedes).
2. Project Settings → Database → **Connection string** → **Transaction pooler** (puerto 6543).
3. En Vercel → Settings → Environment Variables, agrega `DATABASE_URL` con esa cadena (Production + Preview + Development).

### 2. Claves

Vercel → Settings → Environment Variables (Production + Preview + Development):

- `READ_KEY`: clave para ver los programas. Si la dejas vacía, cualquiera con el link puede verlos.
- `EDIT_KEY`: clave de los dirigentes, deja las versiones verificadas.
- `ADMIN_KEY`: tu clave de superusuario. Tiene que ser distinta de las otras.

Después de cambiar variables hay que volver a desplegar (Deployments → ⋯ → Redeploy).

### 3. Traer las variables a tu PC

```bash
cd plantilla-programa-scout
npm install
npx vercel link          # solo la primera vez: elige el proyecto existente
npx vercel env pull .env.local --environment=production
```

Sin Vercel CLI: copia `.env.example` a `.env.local` y pega la `DATABASE_URL`.

### 4. Crear o actualizar las tablas

```bash
npm run db:schema        # aplica db/schema.sql; se puede correr varias veces
```

Si ya habías corrido el esquema anterior, vuelve a correrlo: agrega las columnas nuevas (`archivado_at`, `archivado_por`, `verificada`) sin tocar los datos. También puedes pegar `db/schema.sql` en el SQL Editor de Neon o Supabase.

### 5. Migrar los programas del repositorio

```bash
npm run db:migrar -- --simular   # muestra qué subiría, sin escribir nada
npm run db:migrar                # sube programas/**/*.json (incluye desafio-nutricion/)
```

- Infiere la rama desde `_data.unidad` (todos los actuales son **Manada**), el título desde `nombre-act` y la fecha desde `_fechaIni` o `_data.fecha`.
- Es **idempotente**: si lo corres de nuevo, omite lo que ya existe (mismo hash). Si cambiaste un JSON con la misma rama, fecha y título, lo agrega como nueva versión.
- Autor: "Migración desde el repositorio", `origen = 'migracion'`, versión verificada.

### 6. Probar en local

```bash
npx vercel dev           # http://localhost:3000 (usa .env.local)
# o, sin Vercel CLI:
npm run dev:local        # servidor mínimo que imita vercel.json
npm run test:hash        # prueba sin DB: hash canónico + rama/fecha de todos los JSON
```

En local no hay país/ciudad (esos headers solo existen en Vercel).

### 7. Desplegar y verificar

`git add` de los archivos nuevos → commit → push a `main`. Vercel despliega solo. Luego revisa:

- `https://<tu-dominio>/api/salud` → `"base_de_datos":true,"conectada":true`, con las claves que configuraste.
- `https://<tu-dominio>/programas.html` → pide la clave de lectura y muestra los 9 programas migrados en Manada.
- `https://<tu-dominio>/api/_lib/db.js` y `https://<tu-dominio>/scripts/migrar-programas.mjs` → deben dar **404**. Si alguno responde con el código, avísame.

---

## Archivos

| Archivo | Para qué |
|---|---|
| `db/schema.sql` | Tablas `programas` y `programa_versiones` + índices (idempotente) |
| `api/programas.js` | La API (GET/POST/PUT/PATCH/DELETE) |
| `api/salud.js` | Estado de la nube y rol de la clave |
| `api/_lib/db.js` | Pool de `pg` (Neon/Supabase/local) + `attachDatabasePool` de Vercel |
| `api/_lib/hash.js` | JSON canónico + SHA-256 |
| `api/_lib/programas.js` | Reglas: crear una vez, versionar, duplicados, conflictos, archivar, borrar |
| `api/_lib/http.js` | Respuestas JSON, límite de tamaño, claves/roles, metadata IP/geo |
| `vercel.json` | Reescrituras de `/api/programas/:id…` |
| `.vercelignore` | No sube `scripts/`, `db/` ni esta guía al deploy |
| `js/nube.js` | Frontend: guardar, abrir `?id=`, indicador de estado, respaldo del borrador |
| `js/dialogo.js` | Diálogo de confirmación propio (en lugar de alert/confirm nativos) |
| `programas.html` | Menú por rama, buscador, historial, modo administrador |
| `scripts/aplicar-schema.mjs` · `scripts/migrar-programas.mjs` | Setup y migración |
| `scripts/servidor-local.mjs` · `scripts/probar-hash.mjs` | Pruebas locales |

**Por qué `api/_lib/` y `.vercelignore`:** Vercel da prioridad a los archivos estáticos sobre las reescrituras, así que no se puede "tapar" una carpeta con `vercel.json`. Tampoco se puede excluir con `.vercelignore` código que importan las funciones, porque ni se subiría. Por eso el código compartido vive en `api/_lib/`: según la documentación, los archivos con `_` dentro de `/api` no se convierten en rutas. `scripts/` y `db/` no los usa ninguna función y se excluyen con `.vercelignore`. Igual verifica los 404 del paso 7.

## Notas

- **Abrir un programa (`index.html?id=…`) reemplaza el borrador local.** Antes se guarda una copia (`sfbak_borrador`) que se recupera con **↩️ Restaurar borrador anterior** en el modal de la nube. Si el borrador era del mismo programa y tenía cambios sin subir, se pregunta antes. Si quien guardó no tiene clave de lectura, al recargar sigue con su borrador local.
- **"Restablecer"** limpia el navegador y desvincula el borrador de la nube, así el siguiente guardado crea un programa nuevo. La copia en la nube se conserva.
- **"Guardar como programa nuevo"** (en el modal) sirve para usar un programa como base de otro. Cambia la fecha o el nombre para que no choque con el original.
- **Números de versión:** si el admin borra la última versión (por ejemplo la v5), el próximo guardado vuelve a ser v5.
- **Logos personalizados:** se guardan como imagen en base64 dentro del JSON. Logos muy pesados pueden pasar el límite de 3,5 MB (`MAX_BODY_BYTES`).
- **Respaldo propio:** de vez en cuando, desde el SQL Editor, `SELECT * FROM programa_versiones` → exportar CSV, o `pg_dump "$DATABASE_URL" > respaldo.sql`.
