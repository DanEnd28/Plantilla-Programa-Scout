# 02 · Publicar la versión vanilla actual en Vercel Hobby

> **Estado:** solo documentación, nada construido.
> **Fecha de consulta de los datos:** 23 de septiembre de 2026.
> **Objetivo:** publicar el sitio estático actual (HTML/CSS/JS) en Vercel gratis, sin romper GitHub Pages, y dejar preparado el camino para agregar un backend.

Ver la guía 01 para las condiciones del plan Hobby (uso personal y no comercial; nadie debe cobrar por el desarrollo).

---

## 1. Requisitos

- Cuenta de GitHub dueña del repo: `DanEnd28/Plantilla-Programa-Scout` (cuenta personal, no organización).
- Cuenta de Vercel en plan **Hobby**, creada con "Continue with GitHub".
- Hobby acepta repos **públicos y privados de la cuenta personal**. Lo que **no** acepta son repos privados de una **organización** de GitHub. Si algún día el repo se mueve a una organización del grupo scout, tendría que ser público o pasar a Pro.

---

## 2. Preparar el repo (antes de importar)

### 2.1 Excluir carpetas que no deben publicarse

GitHub Pages usa Jekyll, y Jekyll **ignora por defecto** las carpetas que empiezan con `_` (`_futuro/`, `_archivo/`) y `node_modules/`. Vercel **no** hace eso: publica todo lo que no esté excluido. Sin exclusiones quedarían públicas URLs como `/_futuro/nube-neon/DB-SETUP.md`.

Crear en la raíz un archivo `.vercelignore` (misma sintaxis que `.gitignore`):

```text
# Código archivado o futuro: no se publica
_futuro/
_archivo/

# Dependencias y configuración local
node_modules/
.claude/
package.json
package-lock.json

# Opcional: workflows n8n (pueden contener URLs de webhooks)
docs/n8n/
```

Notas:
- `package.json` hoy solo tiene `sharp` como devDependency (para procesar imágenes en local). Excluirlo evita que Vercel intente instalar dependencias. Si se prefiere no excluirlo, ver la sección 3 (Install Command).
- La doc de `.vercelignore` no dice explícitamente si aplica igual a despliegues desde Git que desde CLI. **Verificar después del primer despliegue** abriendo `https://<proyecto>.vercel.app/_futuro/nube-neon/DB-SETUP.md`: debe dar 404.

### 2.2 Rutas relativas

GitHub Pages sirve el sitio bajo `/Plantilla-Programa-Scout/`; Vercel lo sirve en la raíz `/`. Si todas las rutas en HTML/JS son **relativas** (`css/estilo.css`, `programas/2026-09-19.json`), funciona igual en ambos. Revisar que no haya rutas absolutas con el prefijo `/Plantilla-Programa-Scout/` escritas a mano.

---

## 3. Importar el proyecto en Vercel

1. Entrar a https://vercel.com/new.
2. En "Import Git Repository", elegir `DanEnd28/Plantilla-Programa-Scout` (si no aparece, "Adjust GitHub App Permissions" y dar acceso a ese repo).
3. Configurar:

| Campo | Valor |
|---|---|
| Project Name | `ficha-tecnica-scout` (define la URL `ficha-tecnica-scout.vercel.app`) |
| Framework Preset | **Other** |
| Root Directory | `./` (raíz) |
| Build Command | Activar "Override" y dejarlo **vacío** |
| Output Directory | Activar "Override" y poner `.` (la raíz), o dejarlo por defecto: con preset Other y sin `public/`, Vercel sirve la raíz |
| Install Command | Si `package.json` no se excluyó: "Override" con `echo "sin dependencias"` para no instalar `sharp` |
| Environment Variables | Ninguna por ahora |

4. Clic en **Deploy**. En menos de un minuto queda en `https://ficha-tecnica-scout.vercel.app` (si el nombre está tomado, Vercel agrega un sufijo).

Opcional, en vez de configurar en el panel, un `vercel.json` mínimo en la raíz:

```json
{
  "installCommand": "echo sin-dependencias",
  "cleanUrls": true
}
```

Con preset **Other** no hay paso de build por defecto, así que no hace falta declarar `buildCommand`. Lo que diga `vercel.json` tiene prioridad sobre el panel.

`cleanUrls` permite abrir `/programas` en lugar de `/programas.html`. Probar que los enlaces internos sigan funcionando antes de dejarlo activo.

---

## 4. Previews por rama

- Cada `git push` a `main` genera un despliegue de **producción**.
- Cada push a otra rama (o cada Pull Request) genera un **Preview** con URL propia, del estilo `ficha-tecnica-scout-git-<rama>-<usuario>.vercel.app`. Vercel comenta el enlace en el PR.
- Ideal para que otro dirigente revise un cambio de diseño antes de mezclarlo en `main`.
- En Hobby, los previews quedan protegidos por "Vercel Authentication" (solo quien tenga cuenta con acceso puede verlos). Se puede desactivar en Settings → Deployment Protection si se quiere compartir el enlace libremente. Hobby permite además "Shareable Links".
- Límite: 100 despliegues por día (muy por encima de lo necesario).

---

## 5. Convivencia con GitHub Pages

Ambos servicios pueden publicar **el mismo repo y la misma rama** a la vez: GitHub Pages sigue construyendo con Jekyll y Vercel con su propio proceso. No se estorban.

Recomendación:
- **Oficial:** mantener `https://danend28.github.io/Plantilla-Programa-Scout/` como URL oficial mientras la V1 sea estática (es la que ya conocen los dirigentes).
- **Vercel:** usarlo para previews por rama y como "ensayo" de la V2.
- Cuando exista backend (V2), invertir: Vercel pasa a ser oficial y GitHub Pages se apaga (Settings → Pages → desactivar) o se deja con un `index.html` que redirija a la nueva URL.
- Para evitar contenido duplicado en buscadores, se puede agregar en las páginas una etiqueta `<link rel="canonical" href="...">` apuntando a la URL oficial.

Diferencias a recordar:

| Tema | GitHub Pages (Jekyll) | Vercel |
|---|---|---|
| Carpetas `_algo/` | Ignoradas por defecto | Publicadas salvo `.vercelignore` |
| Archivos `.md` | Convertidos a HTML (Liquid procesa las llaves dobles) | Servidos como texto tal cual |
| Ruta base | `/Plantilla-Programa-Scout/` | `/` |
| Previews por rama | No | Sí |
| Funciones backend | No | Sí (`api/`) |

---

## 6. Agregar un backend gratis después

### Opción 1 · Vercel Functions en `api/` (lo más simple)

Cualquier archivo en `api/` se convierte en un endpoint. Ejemplo `api/guardar-programa.js` que reenvía a n8n sin exponer la URL del webhook:

```js
// api/guardar-programa.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const resp = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET
    },
    body: JSON.stringify(req.body)
  });

  if (!resp.ok) return res.status(502).json({ error: "No se pudo avisar a n8n" });
  return res.status(200).json({ ok: true });
}
```

- Variables `N8N_WEBHOOK_URL` y `N8N_WEBHOOK_SECRET` en Settings → Environment Variables.
- Si se agrega `api/`, **quitar `package.json` del `.vercelignore`** si la función necesita dependencias.
- El backend archivado en `_futuro/nube-neon/` ya sigue este patrón (Vercel Functions + Neon); puede reactivarse moviendo su `api/` a la raíz y revisando su `vercel.json`.
- Límites en Hobby: 1 M invocaciones, 4 CPU-horas activas y 300 s por ejecución al mes. Sobra para este uso.

### Opción 2 · Backend separado

Para la V2 con NestJS se recomienda un proyecto aparte (NestJS también funciona como Vercel Function sin configuración). Ver la guía 03.

---

## 7. Checklist

- [ ] `.vercelignore` creado con `_futuro/`, `_archivo/`, `node_modules/`, `.claude/`.
- [ ] Rutas relativas revisadas.
- [ ] Proyecto importado con preset **Other**, sin build.
- [ ] Verificado que `/_futuro/...` da 404 en Vercel.
- [ ] Decidido cuál URL es la oficial y comunicado a los dirigentes.

---

## Fuentes

Todas consultadas el 23-sep-2026.

- Vercel, Hobby Plan: https://vercel.com/docs/plans/hobby
- Vercel, Fair Use Guidelines: https://vercel.com/docs/limits/fair-use-guidelines
- Vercel, `.vercelignore`: https://vercel.com/docs/deployments/vercel-ignore
- Vercel, Git deployments: https://vercel.com/docs/git
- Vercel Community, repos privados de organizaciones en Hobby: https://community.vercel.com/t/why-cant-hobby-accounts-deploy-from-organizations/10015
- Vercel, NestJS on Vercel: https://vercel.com/docs/frameworks/backend/nestjs
