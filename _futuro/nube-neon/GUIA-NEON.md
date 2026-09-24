# 🐘 Guía paso a paso: Neon + Vercel para los programas scout

Esta guía es para hacerlo por primera vez sin experiencia previa. Toma unos 30 minutos. La explicación técnica completa está en [DB-SETUP.md](DB-SETUP.md).

> Nombres de menús y variables verificados con la documentación de Vercel y Neon (septiembre 2026). Si algún botón se llama un poco distinto, busca la palabra clave (Storage, Neon, Environment Variables).

---

## 0. Lo que necesitas

- Acceso al proyecto **Plantilla-Programa-Scout** en vercel.com (el que despliega desde GitHub).
- En tu PC: Node.js 20 o más nuevo (`node --version`), git y la carpeta del proyecto.
- 3 claves inventadas por ti (paso 2).

---

## 1. Crear la base de datos Neon desde Vercel

1. Entra a **vercel.com** → abre el proyecto **Plantilla-Programa-Scout**.
2. Arriba, pestaña **Storage** → botón **Create Database** (o **Connect Database**).
3. En la lista del Marketplace elige **Neon** (Serverless Postgres) → **Continue**.
4. Si te lo pide, acepta crear la cuenta de Neon vinculada a Vercel. No necesitas crear una cuenta aparte en neon.com.
5. **Región:** elige **Washington, D.C., USA (East) – `iad1`** (AWS us-east-1). Es donde corren por defecto las funciones de Vercel y queda cerca de Venezuela.
6. **Plan:** **Free**.
7. **Nombre de la base de datos:** por ejemplo `programas-scout` → **Create**.
8. Al terminar aparece **Connect Project** (o la pantalla del proyecto con la base ya creada):
   - Proyecto: **Plantilla-Programa-Scout**.
   - Entornos: marca los tres, **Development**, **Preview** y **Production**.
   - Deja el prefijo de variables vacío (así se llama `DATABASE_URL` y no `ALGO_DATABASE_URL`).
   - Si ves una opción para crear una rama (*branch*) de base de datos por cada Preview, déjala **apagada** por ahora. Así todos los entornos usan la misma base y es más simple.
9. **Connect.**

### ¿Qué variables crea Vercel?

Ve a **Settings → Environment Variables** del proyecto. Verás variables nuevas como estas (la lista exacta puede variar):

| Variable | Qué es | ¿La usa el código? |
|---|---|---|
| `DATABASE_URL` | Conexión **con pooler** (el host tiene `-pooler`). Ideal para funciones serverless. | ✅ **Esta** |
| `DATABASE_URL_UNPOOLED` | Conexión **directa**, sin pooler. Para herramientas como `pg_dump`. | Solo para backups o si algo falla (ver errores) |
| `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGDATABASE`, `PGPASSWORD` | Las mismas credenciales por separado | No |
| `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_PRISMA_URL`, … | Nombres "legacy" para plantillas viejas de Vercel | `POSTGRES_URL` solo como respaldo si faltara `DATABASE_URL` |

**No copies estas variables a ningún archivo del repositorio.** Viven en Vercel y en tu `.env.local`, que está en `.gitignore`.

---

## 2. Crear las 3 claves del grupo

En **Settings → Environment Variables** → **Add New** (o **Create new**), agrega cada una con los entornos **Production, Preview y Development** marcados:

| Nombre | Para quién | Qué permite |
|---|---|---|
| `READ_KEY` | Dirigentes (y quien quieras que solo mire) | Ver la lista, abrir programas y el historial |
| `EDIT_KEY` | Dirigentes que programan | Todo lo anterior + guardar versiones **verificadas** |
| `ADMIN_KEY` | Solo tú | Todo + archivar, desarchivar y borrar |

Sin clave cualquiera puede *guardar*, pero la versión queda **sin verificar** y no puede ver nada. La matriz completa está en DB-SETUP.md.

**Cómo generarlas:**
- `READ_KEY` y `EDIT_KEY` las vas a dictar por WhatsApp, así que conviene una frase fácil de escribir en el teléfono, sin tildes ni espacios. Ejemplos: `lobos-guaparo-2026`, `baloo-programa-sep26`. Que sean distintas entre sí.
- `ADMIN_KEY` solo la usas tú, así que mejor aleatoria y larga. En una terminal:
  ```bash
  node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"
  ```
  Guárdala en tu gestor de contraseñas.

> Cada vez que agregues o cambies una variable, Vercel **no** la aplica al deploy que ya está publicado. Hay que volver a desplegar (paso 7, o Deployments → ⋯ → **Redeploy**).

---

## 3. Conectar tu PC al proyecto de Vercel

En una terminal, dentro de la carpeta del proyecto:

```bash
cd ~/workspace/other/plantilla-programa-scout
npm install                      # instala pg y @vercel/functions
npx vercel login                 # solo la primera vez (abre el navegador)
npx vercel link                  # elige tu equipo → "Link to existing project" → Plantilla-Programa-Scout
npx vercel env pull .env.local --environment=production
```

El último comando crea `.env.local` con las variables de **Production**, incluida `DATABASE_URL`. Los scripts lo leen solos. No lo subas a git (ya está en `.gitignore`).

> ¿Por qué `--environment=production`? Así te aseguras de que la migración escribe en la base que usa el sitio publicado. Si más adelante activas ramas por entorno, Development podría apuntar a otra rama.

---

## 4. Crear las tablas y migrar los programas

```bash
npm run db:schema                # crea las tablas (se puede repetir sin problema)
npm run db:migrar -- --simular   # SOLO muestra qué subiría; no escribe nada
```

Revisa la lista del simulacro: deberían salir **9 programas, todos de Manada**, con su fecha. Si se ve bien:

```bash
npm run db:migrar                # sube los 9 programas
npm run db:migrar                # (opcional) repetirlo debe decir "0 creados, 9 omitidos"
```

---

## 5. Probar en tu PC

```bash
npm run dev:local                # abre http://localhost:3000
```

Si prefieres el entorno oficial de Vercel, usa `npx vercel dev`.

1. `http://localhost:3000/programas.html` → pide la clave: pon tu `READ_KEY` → aparecen los 9 programas en Manada.
2. Abre uno → **☁️ Guardar** → escribe tu nombre y la `EDIT_KEY` → debe decir "Guardado como v2".
3. En **🔐 Admin** con tu `ADMIN_KEY` deben aparecer los botones Archivar y Borrar.

⚠️ Esto escribe en la base **real** (la de producción). Lo que pruebes queda en el historial. Puedes borrarlo después como admin.

Para parar el servidor: `Ctrl + C`.

---

## 6. Guardar los cambios en git (commit) y subirlos (push)

`node_modules` ya quedó fuera del índice (con `git rm -r --cached node_modules`) y ahora está en `.gitignore`. Vercel instala las dependencias solo a partir de `package.json`. Ese borrado entra en el mismo commit.

```bash
git status                       # revisa: verás "deleted: node_modules/..." (ya en stage) y los archivos nuevos
git add .gitignore .vercelignore .env.example DB-SETUP.md GUIA-NEON.md vercel.json \
        package.json package-lock.json index.html v1.html ayuda.html programas.html api db js scripts \
        docs programas
git status                       # confirma que .env.local NO aparece
git commit -m "Programas en la nube: Neon + API en Vercel, versiones, claves y modo admin

- API en /api (Vercel Functions) con Postgres (Neon) y código compartido en api/_lib
- Cada guardado es una nueva versión; se detectan duplicados por hash
- Claves READ_KEY / EDIT_KEY / ADMIN_KEY; versiones sin clave quedan sin verificar
- programas.html: lista por rama, historial, archivar y borrar (admin)
- Indicadores de Logro oficiales (Manada, Tropa y Clan) desde el IP Waingunga; docs/bd-futura
- Migración de programas/*.json y guías DB-SETUP.md / GUIA-NEON.md
- node_modules fuera del repositorio"
git push origin main
```

`promesa-ley-manada.html` estaba sin subir desde antes y no forma parte de este cambio. Agrégalo aparte si quieres (`git add promesa-ley-manada.html`).

Vercel detecta el push y despliega solo. Sigue el progreso en la pestaña **Deployments** (tarda 1–2 minutos).

---

## 7. Verificar en producción

1. Abre `https://<tu-dominio>/api/salud`. Debe verse algo así:
   ```json
   {"ok":true,"base_de_datos":true,"conectada":true,"edicion_configurada":true,
    "lectura_protegida":true,"admin_configurado":true,"rol":"anonimo","clave_invalida":false}
   ```
   Si `base_de_datos` o alguna clave sale `false`, falta la variable en **Production** o hace falta un **Redeploy**.
2. Abre `https://<tu-dominio>/programas.html` → pide la clave → con `READ_KEY` se ven los 9 programas.
3. Abre `https://<tu-dominio>/api/_lib/db.js` y `https://<tu-dominio>/scripts/migrar-programas.mjs` → ambos deben dar **404**.
4. Guarda algo de prueba desde el teléfono. En el historial deberían aparecer país/ciudad (en producción sí existen esos datos).

---

## 8. Ver los datos en la consola de Neon

- En Vercel → **Storage** → tu base → botón **Open in Neon** (o entra a console.neon.tech con la misma cuenta).
- **Tables:** para ver las tablas `programas` y `programa_versiones` como hoja de cálculo.
- **SQL Editor:** para consultas. Algunas útiles:

```sql
-- Programas activos con su última versión
SELECT rama, fecha, titulo, version_actual, updated_at
  FROM programas WHERE archivado_at IS NULL ORDER BY fecha DESC;

-- Últimos 20 guardados, con autor, si está verificado y desde dónde
SELECT p.titulo, v.version, v.autor, v.verificada,
       v.metadata->'servidor'->>'ciudad' AS ciudad, v.created_at
  FROM programa_versiones v JOIN programas p ON p.id = v.programa_id
 ORDER BY v.created_at DESC LIMIT 20;

-- Guardados sin verificar
SELECT p.titulo, v.version, v.autor, v.created_at
  FROM programa_versiones v JOIN programas p ON p.id = v.programa_id
 WHERE NOT v.verificada ORDER BY v.created_at DESC;

-- Espacio usado
SELECT pg_size_pretty(pg_database_size(current_database()));
```

## 9. Backups

Hazlo antes de cambios grandes y una vez al mes.

- **Restauración instantánea (automática):** en el plan Free Neon guarda las últimas **6 horas** de historia. Desde la consola: **Backup & Restore** (o *Restore*) → elige el momento. Sirve para deshacer un error reciente.
- **Branch como foto:** consola → **Branches** → **Create branch** desde `main` → nombre, por ejemplo `respaldo-2026-10`. Es una copia completa y congelada en ese momento. El plan Free permite unas 10 ramas por proyecto, así que borra las viejas.
- **Archivo en tu PC (`pg_dump`):** es el respaldo más seguro. Usa la conexión **directa**:
  ```bash
  # Con Docker (no necesitas instalar Postgres). Pega el valor de DATABASE_URL_UNPOOLED de tu .env.local:
  docker run --rm postgres:17-alpine pg_dump "postgresql://…UNPOOLED…" > respaldo-$(date +%F).sql
  ```
  La versión de `pg_dump` debe ser igual o más nueva que la de la base; si sale un error de versión, cambia `17` por `18`. Para restaurar en otra base: `psql "<url>" < respaldo-AAAA-MM-DD.sql`.

## 10. Límites del plan Free (septiembre 2026)

- **0,5 GB** de almacenamiento por proyecto. Un programa pesa unos 20 KB por versión, así que alcanza para miles de versiones.
- **100 CU-horas** de cómputo al mes por proyecto. Con el uso de un grupo scout sobra.
- **Scale to zero:** tras **5 minutos** sin uso la base "se duerme" y **despierta sola** con la siguiente petición. El primer guardado o la primera carga tras un rato tarda uno o dos segundos más. No hay que hacer nada.
- **5 GB** al mes de transferencia.
- Si se pasa un límite, Neon suspende el cómputo o bloquea escrituras hasta el mes siguiente, pero **no borra datos**.

Confirma los números vigentes en neon.com/pricing.

---

## 11. Errores comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `/api/salud` → `"base_de_datos": false` | `DATABASE_URL` no está en Production, o no se volvió a desplegar | Revisa Settings → Environment Variables → **Redeploy** |
| `/api/salud` → `"conectada": false` | Base suspendida por límite, credenciales rotadas, o región caída | Mira la consola de Neon (Monitoring). Si cambiaste la contraseña, reconecta la integración y redeploy |
| Al conectar Neon: "environment variable already exists" | Ya había un `DATABASE_URL` o `PG*` creado a mano | Borra o renombra esa variable en Vercel y vuelve a **Connect Project** |
| `npm run db:schema` → `ECONNREFUSED` o "falta DATABASE_URL" | No existe `.env.local` o estás en otra carpeta | Repite `npx vercel env pull .env.local --environment=production` dentro del proyecto |
| `password authentication failed` | `.env.local` viejo | Vuelve a hacer `vercel env pull` |
| `db:schema` falla con un error raro del pooler | Algunos comandos no van bien por PgBouncer | `DATABASE_URL="$(grep ^DATABASE_URL_UNPOOLED= .env.local \| cut -d= -f2- \| tr -d '"')" npm run db:schema` |
| Los 9 programas no aparecen en producción | Migraste contra otro entorno o rama | Repite el paso 3 con `--environment=production` y el paso 4 |
| `programas.html` → "Se necesita la clave" aunque la pusiste | Espacios de más o una clave distinta a la de Vercel | Escríbela de nuevo; la clave distingue mayúsculas |
| Guardar dice "La clave del grupo no es correcta" | Clave mal escrita (a propósito no se guarda "sin verificar") | Corrígela o deja el campo vacío para guardar sin verificar |
| Error 404 en `/api/...` en producción | El deploy no incluyó las funciones | En Settings → General, *Framework Preset* debe ser **Other**, sin *Output Directory* personalizado; revisa que `api/` se subió a GitHub |
| En los logs: `Cannot find module 'pg'` | `package.json` o `package-lock.json` no se subieron | Súbelos (paso 6); Vercel instala las dependencias solo |
| Error 413 "El programa pesa demasiado" | Logos muy pesados embebidos | Usa imágenes más livianas (menos de ~300 KB) |
| La primera carga tarda unos segundos | Scale to zero (la base estaba dormida) | Normal en el plan Free |

Los logs de las funciones están en Vercel → proyecto → **Logs** (o en Deployments → el deploy → **Functions**).
