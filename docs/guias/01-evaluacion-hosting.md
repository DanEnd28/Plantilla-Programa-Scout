# 01 · Evaluación de hosting para la Ficha Técnica

> **Estado:** solo documentación, nada construido.
> **Fecha de consulta de los datos:** 23 de septiembre de 2026.
> **Alcance:** dónde publicar la Ficha Técnica del Grupo Scout La Salle Guaparo (ASV) hoy (V1, sitio estático) y mañana (V2: Next.js + NestJS + PostgreSQL en monorepo pnpm).

Los precios y límites de los proveedores cambian a menudo. Todo lo que está aquí se verificó en la fecha indicada; cuando un dato no se pudo confirmar en una fuente oficial se marca como **(no verificado)**.

---

## 1. Punto de partida

| Pieza | Hoy (V1) | Futuro (V2) |
|---|---|---|
| Frontend | HTML/CSS/JS vanilla en GitHub Pages (`danend28.github.io/Plantilla-Programa-Scout/`) | Next.js (`apps/web`) |
| Backend | Ninguno (hay uno viejo Vercel Functions + Neon archivado en `_futuro/nube-neon/`) | NestJS (`apps/api`) |
| Base de datos | Ninguna (los programas son JSON en `programas/`) | PostgreSQL |
| Automatización | Workflow n8n `docs/n8n/aviso-programa-nuevo.json` (webhook → correo) | Igual, disparado desde el backend |
| Usuarios | Decenas de dirigentes | Igual, pero con **datos de menores** (hay que protegerlos) |

Conclusión previa: el volumen es muy bajo (decenas de usuarios, pocas escrituras por semana). Cualquier plan gratuito alcanza en capacidad; lo que decide es **fiabilidad, esfuerzo de mantenimiento y protección de datos**.

---

## 2. Opción A · Todo online y gratis

### 2.1 Frontend: Vercel Hobby

- **Precio:** gratis.
- **Condición clave:** el plan Hobby es solo para **uso personal y no comercial**. Vercel define como comercial cualquier despliegue usado para obtener ganancia económica de *cualquiera* que participe en la producción, incluido "un empleado o consultor pagado que escribe el código". Ejemplos: cobrar pagos a visitantes, anunciar venta de productos o servicios, **cobrar por crear, actualizar o alojar el sitio**, sitios de afiliados, publicidad (AdSense). Pedir **donaciones no** es uso comercial.
- **Por qué encaja con un grupo scout:** no se cobra nada, no hay publicidad ni venta. Encaja siempre que **nadie cobre por construirlo o mantenerlo**. Si en algún momento Danny cobrara al grupo o a ASV por el desarrollo, el proyecto pasaría a ser "comercial" según esa definición y habría que pasar a Pro (20 USD por usuario/mes). Si hay duda, Vercel recomienda escribir a soporte.
- **Otra limitación práctica:** Hobby no tiene colaboración en equipo; solo el dueño de la cuenta administra el proyecto. Tampoco puede desplegar repos **privados de una organización** de GitHub (sí repos privados de la cuenta personal, como `DanEnd28/...`).

Límites mensuales de Hobby (página oficial, actualizada 2026-09-14):

| Recurso | Incluido |
|---|---|
| Fast Data Transfer | 100 GB |
| Fast Origin Transfer | 10 GB |
| Edge Requests | 1.000.000 |
| Invocaciones de funciones | 1.000.000 |
| Active CPU (funciones) | 4 CPU-horas |
| Provisioned Memory | 360 GB-horas |
| Duración máxima de una función | 300 s |
| Despliegues por día | 100 |
| Proyectos | 200 |
| Logs en tiempo de ejecución | 1 hora |

Si se exceden, Vercel pausa la función afectada y en general hay que esperar 30 días. Para decenas de dirigentes estos límites están muy lejos.

### 2.2 Backend NestJS gratis: comparación de servicios

| Servicio | ¿Gratis en sep-2026? | Condiciones reales | Veredicto |
|---|---|---|---|
| **Vercel Functions** (NestJS "zero-config") | Sí, dentro de Hobby | Vercel detecta NestJS automáticamente (entrada `src/main.ts` u otras) y lo convierte en **una sola Vercel Function** con Fluid compute. Límite de bundle 250 MB, duración máx. 300 s, 4 CPU-h activas/mes. Arranques en frío posibles pero cortos (segundos, no minutos) | **Recomendado para V2 en la Opción A**: misma cuenta que el frontend, no se "duerme" como Render |
| **Render** free | Sí | Se apaga tras **15 min sin tráfico** y tarda **~1 min** en despertar. 750 horas de instancia gratis por workspace/mes (un mes tiene ~730 h, alcanza para un servicio 24/7). Sin disco persistente, sin SSH, **bloquea puertos SMTP** (25/465/587). Postgres gratis de Render **expira a los 30 días** (no usarlo; usar Neon) | Buena alternativa si se quiere Docker. El despertar de 1 min es molesto para los dirigentes |
| **Koyeb** | Aparentemente sí, con dudas | La doc oficial sigue listando **una instancia free** por organización: 512 MB RAM, 0,1 vCPU, 2 GB SSD, en Frankfurt o Washington D.C. Koyeb anunció que **se une a Mistral AI**; un sitio de terceros afirma que el nivel gratuito se cerró a usuarios nuevos en 2026 **(no verificado, contradice la doc oficial)** | No apostar la V2 a esto sin probar primero el registro |
| **Railway** | No hay plan gratis útil | Trial: 5 USD de crédito único por 30 días. Después pasa al plan Free con **1 USD de crédito al mes** (sin acumular). Los volúmenes de cuentas trial se borran 30 días tras vencer el crédito | 1 USD/mes no alcanza para una API 24/7 con garantías. Descartado como gratis |
| **Fly.io** | No | Ya no hay asignación gratuita para cuentas nuevas. Solo un trial de **2 horas de máquina o 7 días**, lo que ocurra primero. Luego es pago por uso (la máquina más pequeña ronda centavos o pocos USD al mes según región) | Descartado como gratis |
| **Google Cloud Run** | Sí, con tarjeta | Free tier mensual (facturación por solicitud, regiones como `us-central1`): **180.000 vCPU-segundos, 360.000 GiB-segundos, 2 millones de solicitudes**. Requiere **cuenta de facturación con tarjeta**. Escala a cero (arranque en frío de segundos). Las instancias mínimas siempre encendidas **no** son gratis | Técnicamente muy bueno, pero exige tarjeta y configurar GCP (más complejo) |
| Otras (Northflank, Zeabur, etc.) | **No verificado** | No se revisaron sus condiciones actuales | Fuera de esta evaluación |

### 2.3 Base de datos gratis

**Neon Free** (doc oficial "Neon plans"):

| Recurso | Límite |
|---|---|
| Proyectos | 100 por organización |
| Almacenamiento | **0,5 GB por proyecto** |
| Cómputo | **100 CU-horas por proyecto al mes** (≈400 h de un cómputo de 0,25 CU) |
| Ramas | 10 por proyecto |
| Transferencia pública | 5 GB por proyecto al mes |
| Restauración (PITR) | 6 horas de historial |
| Snapshots manuales | 1 por proyecto |
| Escala a cero | Tras 5 min de inactividad, **obligatorio** en Free |

Si se agotan las CU-horas o la transferencia, el cómputo se **suspende** hasta el siguiente mes (no se borra). Si se llena el almacenamiento, fallan las escrituras. Para fichas de programas (texto) 0,5 GB son miles de programas. El despertar tras la escala a cero tarda poco (menos de un segundo a pocos segundos).

**Supabase Free** (alternativa): 500 MB de base por proyecto, 2 proyectos activos, 5 GB de egress, **sin backups automáticos**, y **los proyectos se pausan tras 1 semana de inactividad** (hay que reactivarlos a mano). Para un grupo scout con uso semanal irregular, la pausa semanal es un riesgo real. Neon es mejor opción aquí.

### 2.4 ¿Dónde corre n8n en la Opción A?

| Opción | Costo | Comentario |
|---|---|---|
| n8n Cloud | Starter **20 EUR/mes** (facturación anual; 2.500 ejecuciones) | No es gratis |
| n8n en Render free | 0 | **No sirve bien**: se duerme a los 15 min, pierde los webhooks o responde con 1 min de retraso, y sin disco persistente pierde su SQLite |
| **Reutilizar `n8n.lety.ai`** (VPS de Danny) | 0 extra | Funciona ya. Pregunta abierta: mezcla un proyecto voluntario con la instancia de trabajo. Si en el futuro viajan datos de menores por ese webhook, conviene **no** mandarlos (solo "se guardó el programa X" y un enlace) o separar la instancia |
| n8n en el VPS de la Opción B | Incluido en el VPS | Lo más limpio si se llega a tener VPS propio |
| Sin n8n: el backend envía el correo directo | 0 | Opción válida para un solo aviso. Requiere un proveedor de correo transaccional (sus planes gratis **no se verificaron** en esta guía) |

---

## 3. Opción B · Servidor propio (Contabo VPS)

### 3.1 Plan más barato (página oficial de Contabo, 23-sep-2026)

| Dato | Valor |
|---|---|
| Plan | **Cloud VPS 4** (el más pequeño de la línea "Core" que muestra hoy la web) |
| vCPU | 4 |
| RAM | 8 GB |
| Disco | 100 GB SSD (ampliable con costo) |
| Puerto | 200 Mbit/s |
| Tráfico | "Ilimitado" con política de uso justo |
| Snapshots | 1 incluido |
| Precio | **5,50 EUR/mes IVA incluido** (≈ 5,99 USD) **con contrato de 24 meses** |
| Cargo de instalación | La página de un plan hermano (Core 12) dice "sin cargo de instalación en todos los plazos"; para Cloud VPS 4 **no se vio el texto explícito (no verificado)** |
| Regiones | 9 regiones / 11–12 ubicaciones (UE, Reino Unido, EE. UU., Singapur, Japón, India, Australia). Recargos por región: **no verificados** (históricamente EE. UU./Asia cuestan algo más) |
| Auto Backup | Complemento pago; precio para Cloud VPS 4 **no verificado** (en Core 12 figura 6,70 EUR/mes) |

Notas:
- El precio mostrado es por el plazo de 24 meses. En el plan Core 12 se ve que el precio a 1 mes es ~20 % más caro que a 24 meses; es razonable esperar lo mismo en Cloud VPS 4 **(no verificado)**.
- Varios sitios de reseñas citan un "Cloud VPS 10" (3 vCPU, 8 GB, 75 GB NVMe, 4,95 USD). Es de la línea anterior (mayo 2025) y **ya no aparece** en la web oficial consultada. Confirmar en el carrito antes de comprar.
- Para Venezuela, elegir la región de EE. UU. (menor latencia) si el recargo es pequeño; si no, Europa funciona bien para un sitio de este tamaño.

### 3.2 Docker + Coolify

**Coolify** es un panel open source autoalojado tipo "Heroku/Vercel propio": conecta el repo de GitHub, construye con Dockerfile o Nixpacks, gestiona dominios, HTTPS, bases de datos y backups desde una web.

- Instalación oficial: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash` (instala Docker si falta).
- Requisitos mínimos: **2 núcleos, 2 GB RAM, 10 GB libres**, amd64 o arm64, Ubuntu LTS recomendado. El Cloud VPS 4 sobra.
- Panel en el puerto 8000. Proxy por defecto: **Traefik**; se puede cambiar a **Caddy**. Ambos obtienen certificados de Let's Encrypt automáticamente.

Alternativa sin panel: `docker compose` + Caddy (ver guía 04). Menos piezas, pero todo a mano.

### 3.3 Dominio

| Opción | Costo | Comentario |
|---|---|---|
| `sslip.io` / `nip.io` | 0 | `ficha.203-0-113-10.sslip.io` resuelve a la IP del VPS sin registrar nada. Perfecto para pruebas. Puede chocar con límites de Let's Encrypt por ser un dominio compartido **(no verificado)** |
| DuckDNS | 0 | Subdominio `algo.duckdns.org` apuntando a la IP. Depende de un servicio voluntario |
| Dominio propio | ~10–15 USD/año (`.org`, `.com`) | Lo más serio y estable; recomendable si hay datos de menores |

### 3.4 HTTPS

Let's Encrypt, automático vía Traefik o Caddy (Coolify) o vía Caddy en el compose. Solo requiere que el dominio apunte a la IP y que los puertos 80/443 estén abiertos.

### 3.5 Backups

- `pg_dump` diario comprimido por cron + copia **fuera del VPS** (rclone a Google Drive / Backblaze B2 / otro). Coolify tiene backups programados de bases a almacenamiento S3.
- Snapshot de Contabo: 1 incluido en el plan (útil antes de actualizar). El Auto Backup diario es pago.
- Probar restaurar al menos una vez. Un backup no probado no es backup.

### 3.6 Seguridad básica

Usuario no root con `sudo`, llaves SSH, `PasswordAuthentication no` y `PermitRootLogin no`, `ufw` (solo 22/80/443), `fail2ban`, `unattended-upgrades`, actualizar imágenes Docker con regularidad. Paso a paso en la guía 04.

---

## 4. Tabla comparativa

| Criterio | V1 GitHub Pages (hoy) | Opción A (Vercel + Vercel Functions/Render + Neon) | Opción B (Contabo + Coolify) |
|---|---|---|---|
| Costo | 0 | 0 (si nadie cobra por el desarrollo) | ~5,50 EUR/mes (24 meses) + dominio opcional |
| Esfuerzo inicial | Ninguno | Bajo (conectar repos, variables) | Medio-alto (servidor, seguridad, backups) |
| Mantenimiento | Ninguno | Casi nulo | Continuo: parches, backups, monitoreo |
| Fiabilidad | Alta | Alta en Vercel/Neon. Media si el API está en Render (se duerme) | Depende de Danny: un solo servidor, sin redundancia |
| Límites | Solo estático, sin backend | Cuotas mensuales generosas; Neon 0,5 GB; Hobby no comercial | Recursos del VPS (8 GB RAM sobra) |
| n8n | Externo | Externo (n8n.lety.ai o Cloud) | Puede vivir en el mismo VPS |
| Datos de menores | No aplica | Proveedores con buena seguridad por defecto | Toda la responsabilidad es de Danny |

---

## 5. Recomendación

1. **V1: seguir en GitHub Pages.** Es gratis, no se duerme, no tiene límites relevantes y no maneja datos sensibles. Vercel solo aporta previews por rama (guía 02), algo opcional.
2. **V2: empezar en la Opción A**:
   - `apps/web` (Next.js) en Vercel Hobby.
   - `apps/api` (NestJS) como Vercel Function en un **segundo proyecto de Vercel** (zero-config). Mantener un Dockerfile en `apps/api` para poder moverlo a Render o al VPS sin reescribir nada.
   - PostgreSQL en **Neon Free** (no Supabase, por la pausa semanal).
   - n8n: de momento reutilizar `n8n.lety.ai` **sin enviar datos personales en el webhook**; decidir más adelante si separarlo.
3. **Migrar a la Opción B solo si** aparece alguna de estas condiciones: alguien cobra por el desarrollo (deja de aplicar Hobby), se superan cuotas, se quiere n8n propio del grupo, o se necesita control total de dónde están los datos de menores. El Dockerfile y el monorepo hacen que esa migración sea de horas, no de semanas.

Razonamiento: con decenas de usuarios, el costo de la Opción A es 0 y su mantenimiento casi 0; la Opción B cuesta poco en dinero, pero mucho en responsabilidad (parches, backups, seguridad de datos de menores) para un proyecto voluntario.

---

## Fuentes

Todas consultadas el 23-sep-2026.

- Vercel, Hobby Plan: https://vercel.com/docs/plans/hobby
- Vercel, Fair Use Guidelines (uso comercial): https://vercel.com/docs/limits/fair-use-guidelines
- Vercel, NestJS on Vercel: https://vercel.com/docs/frameworks/backend/nestjs
- Vercel Community, repos privados de organizaciones en Hobby: https://community.vercel.com/t/why-cant-hobby-accounts-deploy-from-organizations/10015
- Render, Deploy for Free: https://render.com/docs/free
- Koyeb, Pricing FAQ: https://www.koyeb.com/docs/faqs/pricing
- srvrlss.io, Koyeb Free Tier 2026 (afirmación no verificada sobre cierre): https://www.srvrlss.io/provider/koyeb/
- Railway, Free Trial: https://docs.railway.com/pricing/free-trial
- Fly.io, Free Trial: https://fly.io/docs/about/free-trial/
- Fly.io, Resource Pricing: https://docs.fly.io/about/pricing/
- Google Cloud Run pricing: https://cloud.google.com/run/pricing
- Neon plans: https://neon.com/docs/introduction/plans
- Neon FAQ límites Free: https://neon.com/faqs/free-plan-limits-and-quotas
- Supabase pricing: https://supabase.com/pricing
- n8n pricing: https://n8n.io/pricing/
- Contabo VPS: https://contabo.com/en/vps/
- Contabo, nueva línea Cloud VPS (mayo 2025): https://contabo.com/blog/the-best-value-vps-on-earth-now-better-than-ever-introducing-the-new-contabo-cloud-vps-lineup/
- Coolify, instalación: https://coolify.io/docs/get-started/installation
- Coolify, proxies: https://coolify.io/docs/knowledge-base/server/proxies
