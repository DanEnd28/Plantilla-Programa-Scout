# 📩 Aviso de programa nuevo (n8n): cómo instalarlo

> **Estado:** workflow listo para importar, **no instalado en ninguna instancia**. La Ficha todavía no tiene el botón «Guardar definitivo»; cuando exista, llamará a este webhook (ver la sección «Cómo se conecta»).
> Archivo: [`aviso-programa-nuevo.json`](aviso-programa-nuevo.json) · Validado con `validate_workflow` de n8n-mcp (0 errores, 0 advertencias) y con pruebas locales de los nodos Code.

## Qué hace

```
POST /webhook/scout-programa-nuevo   (header x-scout-secreto)
  → Configurar Aviso (destinatario, límites)
  → Validar Payload ──✗ 400 / 429 → Responder Rechazo
  → Guardar Datos Ejecución → Armar Correo HTML → Enviar Correo Aviso ──✗ → Responder Error 500
  → Responder 200 OK
Error Trigger → Extraer Info Error → Enviar Alerta Error
```

Payload (JSON):

| Campo | Tipo | Obligatorio | Valores |
|---|---|---|---|
| `titulo` | texto (máx. 160) | sí | Nombre de la actividad |
| `rama` | texto | sí (salvo grupal) | `manada`, `tropa`, `comunidad`, `clan` |
| `tipo` | texto | sí | `unidad` o `grupal` (si es `grupal`, la rama se marca **Grupal**) |
| `fecha` | `AAAA-MM-DD` | sí | Fecha de inicio |
| `fecha_fin` | `AAAA-MM-DD` | no | Si dura más de un día |
| `autor` | texto (máx. 80) | sí | Nombre o cargo (p. ej. «Akela») |
| `origen` | texto | sí | `github-pages`, `servidor` o `prueba` |
| `verificado` | booleano | sí | `true` si se guardó con clave de dirigente |
| `url` | texto `https://` | no | Enlace para abrir el programa |

> 📎 **Adjuntar el PDF de la ficha es para el futuro**: requiere un servidor con Gotenberg (convierte HTML a PDF). En la versión GitHub Pages el correo solo lleva el enlace.

## 1. Importar

1. En n8n: **Workflows → Import from File** → `docs/n8n/aviso-programa-nuevo.json`.
2. Queda **inactivo**. No lo actives hasta terminar los pasos 2 a 4.

## 2. Credenciales

| Nodo | Credencial | Qué poner |
|---|---|---|
| Recibir Aviso Programa | **Header Auth** (`REEMPLAZAR_Header_Scout`) | Name: `x-scout-secreto` · Value: una cadena larga aleatoria (p. ej. `openssl rand -hex 24`) |
| Enviar Correo Aviso y Enviar Alerta Error | **Gmail OAuth2** (`REEMPLAZAR_Gmail_Scout`) | Una cuenta de correo del grupo (no personal) |

¿Prefieres SMTP? Reemplaza los dos nodos Gmail por **Send Email** (credencial SMTP) con: *To* = destinatario, *Subject* = asunto, *HTML* = html (las mismas expresiones que tienen hoy). Mantén en el nodo nuevo *Retry on fail* (2 intentos) y *On error → Continue (using error output)* conectado a **Responder Error 500**.

## 3. Configuración

- **Configurar Aviso**: `destinatario` (uno o varios correos separados por coma), `nombre_grupo`, `url_sitio`, `max_avisos_por_hora` (20 por defecto) y `origenes_permitidos`.
- **Enviar Alerta Error**: cambia `REEMPLAZAR_correo_alertas@ejemplo.com`. Va fijo en el nodo porque el Error Trigger corre en otra ejecución y no ve *Configurar Aviso*.
- **Recibir Aviso Programa → Options → Allowed Origins (CORS)**: `https://danend28.github.io`. Si la Ficha se publica en otro dominio (p. ej. `*.vercel.app`), agrégalo separado por coma.
- **Settings del workflow → Error workflow**: elige este mismo workflow (o el Error Handler general, si se prefiere centralizar).

## 4. URL

- Prueba: `https://TU-N8N/webhook-test/scout-programa-nuevo` (solo mientras el editor está en «Listen for test event»).
- Producción: `https://TU-N8N/webhook/scout-programa-nuevo` (con el workflow **activo**).

## 5. Pruebas con curl

```bash
URL="https://TU-N8N/webhook-test/scout-programa-nuevo"
SECRETO="el-valor-de-la-credencial"

# ✅ Caso válido → 200 y llega el correo
curl -i -X POST "$URL" -H "Content-Type: application/json" -H "x-scout-secreto: $SECRETO" \
  -d '{"titulo":"Prueba de aviso","rama":"manada","tipo":"unidad","fecha":"2026-10-03","autor":"Akela","origen":"prueba","verificado":false}'

# ⚪ Grupal → el correo dice "Grupal"
curl -i -X POST "$URL" -H "Content-Type: application/json" -H "x-scout-secreto: $SECRETO" \
  -d '{"titulo":"Fogata de grupo","tipo":"grupal","fecha":"2026-10-10","autor":"Jefe de Grupo","origen":"prueba","verificado":true}'

# ❌ Payload inválido → 400 con la lista de campos
curl -i -X POST "$URL" -H "Content-Type: application/json" -H "x-scout-secreto: $SECRETO" -d '{"titulo":""}'

# 🔐 Sin secreto → 403 (n8n lo rechaza sin crear ejecución)
curl -i -X POST "$URL" -H "Content-Type: application/json" -d '{}'

# 🌐 Preflight CORS del navegador → debe devolver Access-Control-Allow-Origin
curl -i -X OPTIONS "$URL" -H "Origin: https://danend28.github.io" \
  -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type,x-scout-secreto"
```

El límite de frecuencia (429) solo se nota con el workflow **activo** (en ejecuciones de prueba n8n no guarda el *static data*).

## 🔌 Cómo se conecta

### (a) Versión GitHub Pages: el navegador llama al webhook

Al pulsar «Guardar definitivo» (botón futuro), la Ficha haría algo así (en `js/config.js` irían `avisoUrl` y `avisoSecreto`):

```js
async function avisarProgramaNuevo(datos) {
  const cfg = window.SCOUT_CONFIG || {};
  if (!cfg.avisoUrl) return; // aviso desactivado
  try {
    await fetch(cfg.avisoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-scout-secreto': cfg.avisoSecreto },
      body: JSON.stringify({ ...datos, origen: 'github-pages', verificado: false }),
    });
  } catch (e) { console.warn('[aviso] no se pudo notificar', e); } // nunca bloquea el guardado
}
```

⚠️ **Riesgo:** en un sitio estático **el secreto queda visible** para cualquiera que abra el código de la página (el repo además es público). No es un secreto real: solo filtra bots que no leen el código. Alguien podría usarlo para mandar avisos falsos o llenar el buzón.

**Mitigaciones (ya incluidas o a aplicar):**

- ✅ **Solo notifica**: el webhook no guarda, no borra ni lee nada. Lo peor que pasa es spam de correos.
- ✅ **Validación estricta** de tipos, valores y largo; todo el texto se escapa antes de ir al HTML del correo.
- ✅ **Límite de frecuencia** global (`max_avisos_por_hora`) → 429.
- ✅ **CORS** limitado al dominio de la Ficha (frena a otras webs, no a curl).
- ✅ **Sin datos sensibles**: nunca se envían datos de jóvenes ni de representantes; `verificado` desde el navegador siempre es `false`.
- 🔁 **Rotar el secreto** si empieza el spam (cambiar la credencial y `js/config.js`).
- 🧱 Si hiciera falta: desactivar el workflow, o proteger el webhook detrás de Cloudflare (reglas de rate limit por IP).

### (b) Versión futura: el servidor llama al webhook

Con el backend (NestJS o las funciones de `_futuro/nube-neon/`), el navegador guarda en la API y es **el servidor** quien llama a n8n:

- El secreto vive en una variable de entorno (`N8N_AVISO_URL`, `N8N_AVISO_SECRETO`); nunca llega al navegador.
- `origen: "servidor"` y `verificado` lo decide el servidor según la clave del dirigente.
- Se puede quitar CORS (llamada servidor → servidor) y limitar por IP (`IP(s) Allowlist` del webhook).
- Recién ahí conviene adjuntar el PDF (Gotenberg en el mismo servidor) y registrar cada aviso en la base.

## Checklist antes de activar

- [ ] Credenciales Header Auth y Gmail/SMTP creadas y asignadas
- [ ] `destinatario` y correo de alertas reemplazados
- [ ] Allowed Origins correcto
- [ ] Error workflow configurado en Settings
- [ ] Las 5 pruebas de curl dan 200 / 200 / 400 / 403 / CORS OK
