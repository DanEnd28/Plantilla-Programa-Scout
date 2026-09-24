# 03 · Next.js + NestJS + PostgreSQL online y gratis

> **Estado:** solo documentación, nada construido. Los pasos están escritos "como si ya existiera" el monorepo.
> **Fecha de consulta de los datos:** 23 de septiembre de 2026.
> **Arquitectura (Opción A de la guía 01):** Next.js en Vercel Hobby · NestJS como Vercel Function (proyecto aparte) · PostgreSQL en Neon Free · aviso por n8n. Alternativa para el API: Render free con Docker.

---

## 1. Estructura supuesta del monorepo

```text
Plantilla-Programa-Scout/
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── package.json
├── apps/
│   ├── web/                # Next.js
│   └── api/                # NestJS
│       ├── src/main.ts
│       ├── prisma/schema.prisma
│       ├── prisma.config.ts
│       └── Dockerfile      # para Render o el VPS (guía 04)
└── packages/
    └── shared/             # Indicadores de Logro compartidos (TypeScript)
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Nombres de paquete sugeridos: `@scout/web`, `@scout/api`, `@scout/shared`. Ambas apps declaran `"@scout/shared": "workspace:*"`.

Recomendación para `packages/shared`: que tenga un script `build` (tsc) que genere `dist/`, y que su `package.json` apunte `main`/`types` a `dist/`. Así Next.js, NestJS en Vercel y el Dockerfile lo consumen igual.

---

## 2. Base de datos: Neon Free

1. Crear cuenta en https://neon.com y un proyecto `ficha-tecnica` (región: la más cercana disponible, p. ej. `us-east`).
2. En "Connect", copiar **dos** cadenas:

| Variable | Tipo | Se reconoce por | Uso |
|---|---|---|---|
| `DATABASE_URL` | **Pooled** (PgBouncer de Neon) | `-pooler` en el host | La app en ejecución (muchas conexiones cortas, ideal para serverless) |
| `DATABASE_URL_UNPOOLED` | **Directa** | Sin `-pooler` | Migraciones y comandos del CLI de Prisma |

3. Crear una rama `dev` en Neon para desarrollo local (10 ramas por proyecto en Free).

Límites Free a vigilar: **0,5 GB** de almacenamiento, **100 CU-horas/mes**, 5 GB de transferencia, escala a cero tras 5 min (obligatorio), 6 h de restauración (PITR).

### ORM elegido: Prisma (7.x)

Por qué Prisma y no TypeORM:
- Neon mantiene una guía oficial actualizada para Prisma 7 con su adaptador serverless (`@prisma/adapter-neon`).
- El esquema en un solo archivo y `prisma migrate` son más fáciles de mantener para un proyecto voluntario que las migraciones a mano de TypeORM.
- Tipos generados que se pueden reutilizar junto a `packages/shared`.

TypeORM es el ORM "nativo" en muchos tutoriales de Nest y también sirve; es una cuestión de preferencia, no de capacidad.

`apps/api/prisma.config.ts` (Prisma 7 lee la URL desde aquí, no desde `schema.prisma`):

```ts
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL_UNPOOLED"), // conexión directa para migraciones
  },
});
```

`apps/api/prisma/schema.prisma` (extracto):

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Programa {
  id        String   @id @default(uuid())
  titulo    String
  unidad    String
  fecha     DateTime
  datos     Json
  creadoEn  DateTime @default(now())
}
```

Servicio de Prisma en Nest usando la conexión **pooled**:

```ts
// apps/api/src/prisma.service.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
```

Migraciones (desde la máquina de Danny o desde CI, **no** dentro del servidor):

```bash
cd apps/api
pnpm prisma migrate dev --name inicial     # en local, contra la rama dev de Neon
pnpm prisma migrate deploy                 # contra producción (usa DATABASE_URL_UNPOOLED)
```

---

## 3. Backend NestJS

### 3.1 Código mínimo común

`apps/api/src/main.ts`:

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origenes = (process.env.CORS_ORIGINS ?? "").split(",").filter(Boolean);
  app.enableCors({ origin: origenes, credentials: true });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Health check que **no toca la base de datos** (importante, ver sección 5):

```ts
// apps/api/src/health.controller.ts
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  ok() {
    return { estado: "ok", hora: new Date().toISOString() };
  }
}
```

Variables de entorno del API:

| Variable | Ejemplo | Nota |
|---|---|---|
| `DATABASE_URL` | `postgresql://...-pooler.../neondb?sslmode=require` | Pooled |
| `DATABASE_URL_UNPOOLED` | `postgresql://.../neondb?sslmode=require` | Solo para migraciones |
| `CORS_ORIGINS` | `https://ficha-tecnica-scout.vercel.app` | Separadas por coma. Agregar dominio propio si existe |
| `N8N_WEBHOOK_URL` | `https://n8n.ejemplo/webhook/aviso-programa` | Secreto |
| `N8N_WEBHOOK_SECRET` | cadena aleatoria de 32+ caracteres | Secreto |
| `JWT_SECRET` o similar | cadena aleatoria | Si hay login |

Previews: las URLs de preview de Vercel cambian por rama. Para no abrir CORS a `*`, usar la variable `CORS_ORIGINS` distinta en el entorno Preview, o aceptar un patrón de origen del propio proyecto validándolo con una función en `enableCors`.

### 3.2 Camino recomendado: NestJS como Vercel Function

Vercel detecta NestJS sin configuración si la entrada es `src/main.ts` (u otros nombres como `src/app.ts`, `src/index.ts`). Toda la app se vuelve **una sola función** con Fluid compute.

1. Vercel → Add New → Project → importar el mismo repo.
2. Nombre: `ficha-tecnica-api` → URL `ficha-tecnica-api.vercel.app`.
3. **Root Directory:** `apps/api`. Framework: NestJS (detectado).
4. Build Command (override), para compilar primero el paquete compartido y el cliente de Prisma:
   `cd ../.. && pnpm --filter @scout/shared build && pnpm --filter @scout/api exec prisma generate`
   *(No verificado en un despliegue real: si la detección zero-config de Nest ignora el override, mover esos pasos a un script `vercel-build` o `postinstall` en `apps/api/package.json`.)*
5. Cargar las variables de entorno de la tabla anterior (Production y Preview).
6. Deploy y probar `https://ficha-tecnica-api.vercel.app/health`.

Límites: bundle de 250 MB, 300 s máximo por solicitud, 4 CPU-horas activas y 1 M de invocaciones al mes (Hobby). Arranque en frío: segundos tras un rato sin uso, no el minuto de Render.

### 3.3 Alternativa: Render free con Docker

Útil si se quiere un contenedor clásico (el mismo Dockerfile sirve en el VPS de la guía 04). Costo: se duerme tras 15 min y tarda ~1 min en despertar.

`apps/api/Dockerfile` (multi-stage, se construye **desde la raíz del repo**):

```dockerfile
# ---------- base ----------
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

# ---------- build ----------
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @scout/shared build \
 && pnpm --filter @scout/api exec prisma generate \
 && pnpm --filter @scout/api build
# Copia solo el API con dependencias de producción (incluye @scout/shared)
RUN pnpm deploy --filter @scout/api --prod --legacy /prod/api

# ---------- runtime ----------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /prod/api ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

Notas del Dockerfile:
- `pnpm deploy` copia los archivos que el paquete publicaría: en `apps/api/package.json` poner `"files": ["dist"]` para incluir el compilado.
- `--legacy` es necesario en pnpm 10 si no se activa `inject-workspace-packages=true` en `.npmrc`.
- El cliente de Prisma 7 se genera como TypeScript dentro de `src/generated/` y queda compilado en `dist/`.

En Render: New → Web Service → repo → **Language: Docker**, Dockerfile Path `apps/api/Dockerfile`, Docker Build Context `.` (raíz), Instance Type **Free**, Health Check Path `/health`, variables de entorno igual que arriba. *(La doc de Render Free no menciona restricciones para Docker; confirmar en el panel que aparece "Free".)*

---

## 4. Frontend Next.js en Vercel Hobby

1. Vercel → Add New → Project → mismo repo.
2. Nombre: `ficha-tecnica-scout`.
3. **Root Directory:** `apps/web`. Framework: Next.js (detectado).
4. Vercel detecta pnpm por el `pnpm-lock.yaml` de la raíz e instala el workspace completo. Dejar activada la opción que permite incluir archivos fuera del Root Directory (necesaria para `packages/shared`).
5. En `apps/web/next.config.ts`, si `@scout/shared` se consume como TypeScript fuente:

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@scout/shared"],
};

export default config;
```

6. Variable de entorno: `NEXT_PUBLIC_API_URL=https://ficha-tecnica-api.vercel.app`.
7. En ambos proyectos, activar "Skip deployments when there are no changes to the root directory" (Settings → Build) para que un cambio solo en `apps/web` no redespliegue el API y viceversa. *(Con dependencias compartidas, verificar que un cambio en `packages/shared` sí dispare ambos.)*

---

## 5. Evitar que "se duerma" y mitigarlo

| Pieza | Comportamiento | Mitigación |
|---|---|---|
| Next.js en Vercel | No duerme (estático + funciones con arranque rápido) | Nada |
| NestJS en Vercel | Arranque en frío de segundos tras inactividad | Aceptable. Reducir dependencias pesadas al iniciar |
| NestJS en Render free | Duerme a los 15 min, ~1 min para despertar | Ping a `/health` cada 10–14 min con UptimeRobot o cron-job.org. Un solo servicio 24/7 usa ~730 de las 750 h mensuales: **no alcanza para dos servicios** |
| Neon | Escala a cero a los 5 min (no se puede desactivar en Free) | Nada: despierta rápido. **No** hacer que el ping toque la base: 0,25 CU × 730 h = ~182 CU-h, más que las 100 CU-h gratis |

En la UI conviene mostrar "Cargando…" en la primera petición para que un arranque en frío no parezca un error.

---

## 6. Aviso por n8n (webhook desde el servidor)

La URL del webhook **nunca** va en el frontend. El API la llama después de guardar:

```ts
// apps/api/src/avisos/avisos.service.ts
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AvisosService {
  private readonly log = new Logger(AvisosService.name);

  async programaGuardado(p: { id: string; titulo: string; unidad: string }) {
    try {
      const r = await fetch(process.env.N8N_WEBHOOK_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET!,
        },
        body: JSON.stringify({ id: p.id, titulo: p.titulo, unidad: p.unidad }),
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) this.log.warn(`n8n respondió ${r.status}`);
    } catch (e) {
      this.log.error("No se pudo avisar a n8n", e as Error);
    }
  }
}
```

- En n8n, el nodo Webhook con **Header Auth** (credencial con nombre `X-Webhook-Secret` y el mismo valor).
- Un fallo del aviso no debe impedir guardar el programa (por eso el `try/catch`).
- Enviar solo lo mínimo (id, título, unidad). **Nunca datos de menores** en el webhook, sobre todo si se reutiliza `n8n.lety.ai`, la instancia de trabajo de Danny (opción abierta, ver guía 01).
- El workflow actual `docs/n8n/aviso-programa-nuevo.json` ya recibe un webhook y envía un correo; solo habría que agregarle la validación del encabezado.

---

## 7. Costos y límites resumidos

| Servicio | Costo | Límite que más importa |
|---|---|---|
| Vercel Hobby (web + api) | 0 | Uso no comercial; 4 CPU-h activas/mes; 100 GB de transferencia |
| Neon Free | 0 | 0,5 GB; 100 CU-h/mes |
| Render free (si se usa) | 0 | Duerme a los 15 min; 750 h/mes |
| n8n | 0 si se reutiliza `n8n.lety.ai`; 20 EUR/mes n8n Cloud Starter | Decisión abierta |
| Dominio propio (opcional) | ~10–15 USD/año | Se configura en Vercel → Domains |

Cuándo dejar de ser gratis: si alguien cobra por el desarrollo (Hobby deja de aplicar), si la base pasa de 0,5 GB (p. ej. por subir fotos: usar almacenamiento de archivos aparte), o si se necesitan colaboradores con acceso al panel de Vercel.

---

## Fuentes

Todas consultadas el 23-sep-2026.

- Vercel, NestJS on Vercel: https://vercel.com/docs/frameworks/backend/nestjs
- Vercel, Hobby Plan: https://vercel.com/docs/plans/hobby
- Vercel, Fair Use Guidelines: https://vercel.com/docs/limits/fair-use-guidelines
- Neon, Prisma guide (Prisma 7): https://neon.com/docs/guides/prisma
- Neon plans: https://neon.com/docs/introduction/plans
- Render, Deploy for Free: https://render.com/docs/free
- n8n pricing: https://n8n.io/pricing/
