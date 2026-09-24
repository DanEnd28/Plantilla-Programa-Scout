# ☁️ Backend archivado: Vercel Functions + Neon (Versión 2)

> **Estado: guardado, no se usa.** La versión actual es solo GitHub Pages (sin backend). Esta carpeta empieza con `_`, así que Jekyll (GitHub Pages) **no la publica**.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `api/`, `api/_lib/` | Funciones de Vercel: `programas.js` (CRUD + versiones), `salud.js` |
| `db/schema.sql` | Esquema PostgreSQL (`programas`, `programa_versiones`) |
| `scripts/` | Aplicar esquema, migrar `programas/*.json`, servidor local, prueba de hash |
| `vercel.json`, `.vercelignore`, `.env.example` | Configuración de Vercel y variables |
| `package.json`, `package-lock.json` | Dependencias del backend (`pg`, `@vercel/functions`) |
| `DB-SETUP.md`, `GUIA-NEON.md` | Documentación original de la base y de Neon |

Lo que queda **fuera** de esta carpeta y es parte del mismo sistema:
- `js/nube.js` (cliente del navegador) — desactivado con `js/config.js` → `SCOUT_CONFIG.nube = false`.
- `programas.html` — si la nube está apagada muestra un aviso en vez de consultar la API.

## 🔑 Claves (`READ_KEY`, `EDIT_KEY`, `ADMIN_KEY`)

- **En local** ya están generadas (aleatorias, `openssl rand -base64 24`) en **`_futuro/nube-neon/.env.local`**, que es el archivo que lee `scripts/_env.mjs`. `DATABASE_URL` está vacía hasta crear la base en Neon.
- Ese archivo **no se sube a git**: `.gitignore` ignora `.env*` en cualquier carpeta (salvo `.env.example`). Compruébalo con `git check-ignore -v _futuro/nube-neon/.env.local`.
- **En producción** las claves van en las variables de entorno de Vercel (Settings → Environment Variables), no en archivos.
- Las claves **nunca** se escriben en un `.md`. Si al reactivar se mueven los archivos a la raíz, mover también `.env.local`.

## Cómo reactivarlo (resumen)

Los scripts calculan la raíz como `scripts/..` y buscan `programas/` y `.env` ahí; por eso **hay que devolver los archivos a la raíz del repo**:

```bash
mv _futuro/nube-neon/{api,db,scripts,vercel.json,.vercelignore,.env.example,DB-SETUP.md,GUIA-NEON.md} .
cp _futuro/nube-neon/package.json _futuro/nube-neon/package-lock.json .   # reemplaza los de la raíz
npm install
```

Luego: `nube: true` en `js/config.js`, y seguir `DB-SETUP.md` / `GUIA-NEON.md`. Ojo: al volver a la raíz, en Vercel hay que excluir `_futuro/` y `_archivo/` con `.vercelignore`. Ver también `docs/00-PLAN.md` (Versión 2) y `docs/guias/`.
