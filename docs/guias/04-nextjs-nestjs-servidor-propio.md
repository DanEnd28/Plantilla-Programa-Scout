# 04 · Next.js + NestJS + PostgreSQL en servidor propio (Contabo VPS)

> **Estado:** solo documentación, nada construido. Los pasos están escritos "como si ya existiera" el monorepo de la guía 03.
> **Fecha de consulta de los datos:** 23 de septiembre de 2026.
> **Servidor de referencia:** Contabo **Cloud VPS 4** (4 vCPU, 8 GB RAM, 100 GB SSD, 5,50 EUR/mes con IVA en contrato de 24 meses; ver guía 01).

Dos caminos: **A) Coolify** (panel web, más cómodo) o **B) docker compose + Caddy** (menos piezas, todo a mano). Los pasos 1, 2 y 5–8 son comunes.

---

## 1. Preparar Ubuntu

Elegir **Ubuntu 24.04 LTS** al crear el VPS (o 26.04 LTS si Contabo ya la ofrece; no verificado). Contabo envía la IP y la contraseña de root por correo.

### 1.1 Usuario y llaves SSH

En la máquina de Danny (si no tiene llave):

```bash
ssh-keygen -t ed25519 -C "danny-ficha-scout"
```

En el VPS, como root:

```bash
apt update && apt -y upgrade
adduser danny
usermod -aG sudo danny
mkdir -p /home/danny/.ssh
nano /home/danny/.ssh/authorized_keys      # pegar la llave pública (.pub)
chown -R danny:danny /home/danny/.ssh
chmod 700 /home/danny/.ssh && chmod 600 /home/danny/.ssh/authorized_keys
```

Probar en **otra terminal** que `ssh danny@IP` entra sin contraseña **antes** de seguir.

### 1.2 Endurecer SSH

```bash
sudo tee /etc/ssh/sshd_config.d/99-endurecer.conf >/dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
EOF
sudo sshd -t && sudo systemctl restart ssh
```

### 1.3 Firewall (ufw)

```bash
sudo apt -y install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Cuidado:** los puertos que Docker publica (`ports:` en compose) **se saltan ufw**, porque Docker escribe sus propias reglas de iptables. Regla práctica: solo el proxy (Caddy/Traefik) publica 80/443; los demás servicios no publican puertos o los atan a `127.0.0.1`.

### 1.4 fail2ban y actualizaciones automáticas

```bash
sudo apt -y install fail2ban unattended-upgrades
sudo systemctl enable --now fail2ban          # la jaula sshd viene activa en Ubuntu
sudo dpkg-reconfigure -plow unattended-upgrades
```

Opcional: reinicio automático nocturno si un parche lo requiere, en `/etc/apt/apt.conf.d/50unattended-upgrades`: `Unattended-Upgrade::Automatic-Reboot "true";` y `Unattended-Upgrade::Automatic-Reboot-Time "04:00";`.

---

## 2. Instalar Docker

Método oficial (repositorio apt de Docker):

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker danny      # cerrar sesión y volver a entrar
docker compose version
```

(Si se va por Coolify, su instalador ya instala Docker; este paso se puede saltar.)

---

## 3. Camino A · Coolify

### 3.1 Instalación

Comando oficial actual:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

Requisitos mínimos: 2 núcleos, 2 GB RAM, 10 GB libres (el Cloud VPS 4 sobra).

1. Al terminar, abrir `http://IP:8000` **de inmediato** y crear la cuenta de administrador: el primer registro se queda con el panel.
2. Abrir temporalmente el puerto 8000 en ufw (`sudo ufw allow 8000/tcp`) y cerrarlo cuando el panel tenga dominio con HTTPS. La doc de firewall de Coolify también menciona puertos 6001/6002 para tiempo real **(no reconfirmado en esta consulta)**.
3. Proxy: Coolify usa **Traefik** por defecto; se puede cambiar a **Caddy** en Servers → Proxy. Ambos sacan certificados de Let's Encrypt solos.

### 3.2 Desplegar el monorepo

- **Base de datos:** New Resource → PostgreSQL. Sin puerto público. Configurar "Scheduled Backups" hacia un almacenamiento S3 compatible.
- **API:** New Resource → Application → GitHub (instalar la GitHub App de Coolify con acceso solo a este repo) → Build Pack **Dockerfile**, ruta `apps/api/Dockerfile`, contexto la raíz. Puerto 3000. Health check `/health`. Variables: `DATABASE_URL` (la URL interna que muestra Coolify), `CORS_ORIGINS`, `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`.
- **Web:** Application → Dockerfile `apps/web/Dockerfile` (Next.js con `output: "standalone"`) o Nixpacks con Base Directory `apps/web`. Variable `NEXT_PUBLIC_API_URL` (se usa en build).
- **Dominios:** en cada aplicación, campo Domains, p. ej. `https://ficha.ejemplo.org` y `https://api.ficha.ejemplo.org`.
- **n8n (opcional):** New Resource → Service → n8n (plantilla de un clic).
- **Migraciones:** "Pre-deployment command" de la API: `npx prisma migrate deploy` (requiere incluir el CLI de Prisma en la imagen) o correrlas desde la máquina de Danny por un túnel SSH.

---

## 4. Camino B · docker compose + Caddy (sin Coolify)

Estructura en el servidor: `/opt/ficha/` con `docker-compose.yml`, `Caddyfile`, `.env` y el repo clonado en `/opt/ficha/repo`.

### 4.1 `.env` (permisos 600, nunca en Git)

```bash
DOMINIO_WEB=ficha.203-0-113-10.sslip.io
DOMINIO_API=api.203-0-113-10.sslip.io
DOMINIO_N8N=n8n.203-0-113-10.sslip.io
ACME_EMAIL=correo-del-grupo@ejemplo.org
POSTGRES_PASSWORD=cambia-esto-por-algo-largo
N8N_ENCRYPTION_KEY=cambia-esto-tambien
N8N_WEBHOOK_SECRET=otro-secreto-largo
```

### 4.2 `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ficha
      POSTGRES_USER: ficha
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ficha -d ficha"]
      interval: 10s
      retries: 5
    # sin "ports": solo accesible desde la red interna

  api:
    build:
      context: ./repo
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://ficha:${POSTGRES_PASSWORD}@postgres:5432/ficha
      CORS_ORIGINS: https://${DOMINIO_WEB}
      N8N_WEBHOOK_URL: http://n8n:5678/webhook/aviso-programa
      N8N_WEBHOOK_SECRET: ${N8N_WEBHOOK_SECRET}
      PORT: "3000"
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: ./repo
      dockerfile: apps/web/Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://${DOMINIO_API}
    restart: unless-stopped
    depends_on:
      - api

  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    profiles: ["n8n"]          # solo arranca con: docker compose --profile n8n up -d
    restart: unless-stopped
    environment:
      N8N_HOST: ${DOMINIO_N8N}
      N8N_PROTOCOL: https
      WEBHOOK_URL: https://${DOMINIO_N8N}/
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      GENERIC_TIMEZONE: America/Caracas
    volumes:
      - n8ndata:/home/node/.n8n

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    environment:
      DOMINIO_WEB: ${DOMINIO_WEB}
      DOMINIO_API: ${DOMINIO_API}
      DOMINIO_N8N: ${DOMINIO_N8N}
      ACME_EMAIL: ${ACME_EMAIL}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  pgdata:
  n8ndata:
  caddy_data:
  caddy_config:
```

Notas:
- Solo `caddy` publica puertos. Postgres, API, web y n8n quedan en la red interna de Docker.
- Fijar versiones (`n8nio/n8n:1.x.y`, `postgres:17.x`) en vez de `latest` para actualizar de forma controlada.
- Si n8n no se levanta aquí (se reutiliza `n8n.lety.ai`), cambiar `N8N_WEBHOOK_URL` por la URL pública y quitar su bloque del Caddyfile.

### 4.3 `Caddyfile`

Caddy lee las variables de entorno con la sintaxis de llave simple + `$`:

```text
{
	email {$ACME_EMAIL}
}

(seguridad) {
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}
}

{$DOMINIO_WEB} {
	import seguridad
	encode zstd gzip
	reverse_proxy web:3000
}

{$DOMINIO_API} {
	import seguridad
	encode zstd gzip
	reverse_proxy api:3000
}

{$DOMINIO_N8N} {
	import seguridad
	reverse_proxy n8n:5678
}
```

El bloque `(seguridad)` es un *snippet* reutilizable; se define antes de los sitios y cada sitio lo incluye con `import seguridad`. Caddy obtiene y renueva los certificados de Let's Encrypt automáticamente en cuanto el dominio apunta a la IP.

### 4.4 Arrancar y desplegar

```bash
cd /opt/ficha
git -C repo pull
docker compose build
docker compose up -d                  # agregar --profile n8n si se usa n8n local
docker compose run --rm api npx prisma migrate deploy   # si el CLI de Prisma está en la imagen
docker compose ps
```

---

## 5. Dominios

| Opción | Cómo | Nota |
|---|---|---|
| sslip.io / nip.io | `ficha.203-0-113-10.sslip.io` resuelve solo a `203.0.113.10` | Gratis e inmediato; ideal para pruebas. Posibles límites de Let's Encrypt por dominio compartido (no verificado) |
| DuckDNS | Crear subdominio en duckdns.org y apuntarlo a la IP | Gratis; depende de un servicio voluntario |
| Dominio propio | Comprar (~10–15 USD/año) y crear registros A: `ficha`, `api.ficha`, `n8n.ficha` → IP | Recomendado en producción con datos de menores |

---

## 6. Backups de PostgreSQL

Script `/opt/ficha/backup.sh` (permisos 700):

```bash
#!/usr/bin/env bash
set -euo pipefail
FECHA=$(date +%F_%H%M)
DESTINO=/opt/ficha/backups
mkdir -p "$DESTINO"

docker compose -f /opt/ficha/docker-compose.yml exec -T postgres \
  pg_dump -U ficha -d ficha --format=custom > "$DESTINO/ficha_$FECHA.dump"

# Copia fuera del VPS (remoto "cifrado" configurado con rclone crypt)
rclone copy "$DESTINO/ficha_$FECHA.dump" cifrado:backups-ficha/

# Retención local: 7 días
find "$DESTINO" -name 'ficha_*.dump' -mtime +7 -delete
```

Cron diario (`crontab -e` del usuario `danny`):

```text
30 3 * * * /opt/ficha/backup.sh >> /opt/ficha/backups/backup.log 2>&1
```

- **rclone:** `rclone config` para crear un remoto (Google Drive de la cuenta del grupo, Backblaze B2, etc.) y encima un remoto tipo **crypt** llamado `cifrado`. Los respaldos contendrán datos de menores: **deben ir cifrados**. Los planes gratis de cada almacenamiento no se verificaron en esta guía.
- Retención remota: configurar reglas de ciclo de vida en el almacenamiento o un `rclone delete --min-age 60d`.
- **Restaurar una vez al mes** en una base de prueba: `pg_restore -U ficha -d ficha_prueba archivo.dump`.
- Snapshot de Contabo (1 incluido en el plan) antes de cada actualización grande. El Auto Backup diario de Contabo es pago.
- Si hay n8n local, respaldar también el volumen `n8ndata` y guardar `N8N_ENCRYPTION_KEY` fuera del servidor.

---

## 7. Monitoreo simple

- **Externo (imprescindible):** un monitor fuera del VPS que avise si todo el servidor cae, p. ej. UptimeRobot o Better Stack contra `https://api.../health` y la web. Sus planes gratis actuales **no se verificaron**.
- **Uptime Kuma** (opcional, en el mismo VPS): panel de estado y alertas por Telegram/correo. Agregar al compose:

```yaml
  kuma:
    image: louislam/uptime-kuma:2
    restart: unless-stopped
    volumes:
      - kumadata:/app/data
```

  y un bloque `status.ficha.ejemplo.org` en el Caddyfile con `reverse_proxy kuma:3001` (más `kumadata:` en `volumes`). Verificar la etiqueta de imagen vigente en su repositorio. Un Kuma dentro del mismo VPS no puede avisar si el VPS muere; por eso el monitor externo.
- Espacio en disco: `df -h` y `docker system df` una vez al mes; `docker image prune` tras actualizar.

---

## 8. Actualizaciones

| Qué | Cómo | Frecuencia |
|---|---|---|
| Sistema | `unattended-upgrades` (seguridad automática) + `sudo apt update && sudo apt upgrade` | Automático + revisión mensual |
| Imágenes (Postgres, Caddy, n8n) | Subir la versión fijada en el compose, `docker compose pull && docker compose up -d` | Mensual o ante avisos de seguridad |
| App | `git pull`, `docker compose build`, `up -d` (o push a GitHub si Coolify tiene auto-deploy) | En cada versión |
| Coolify | Panel → actualizar (o auto-update) | Cuando avise |
| Postgres mayor (17 → 18) | `pg_dump` + restaurar en el nuevo; **no** cambiar la etiqueta sin migrar | Rara vez |

Antes de actualizar algo grande: snapshot de Contabo + backup manual.

---

## 9. Checklist de seguridad (datos de menores)

**Servidor**
- [ ] Login root y por contraseña deshabilitados; solo llaves SSH.
- [ ] ufw activo con 22/80/443; ningún contenedor publica puertos salvo el proxy.
- [ ] fail2ban y unattended-upgrades activos.
- [ ] Panel de Coolify (si se usa) detrás de HTTPS y con 2FA; puerto 8000 cerrado.

**Datos**
- [ ] **Minimización:** guardar solo lo necesario (nombre y unidad; evitar cédula, dirección, fotos, datos médicos salvo necesidad real).
- [ ] Postgres sin puerto público; contraseñas largas en `.env` con permisos 600, fuera de Git.
- [ ] Backups **cifrados** (rclone crypt) y fuera del VPS; restauración probada.
- [ ] Nada de datos personales en webhooks de n8n, logs ni correos de aviso (solo id y enlace).
- [ ] Si se reutiliza `n8n.lety.ai` (instancia de trabajo de Danny), confirmar que no recibe datos de menores.

**Aplicación**
- [ ] Solo HTTPS (HSTS activo); CORS limitado al dominio de la web.
- [ ] Login obligatorio para ver datos de menores; roles (dirigente de unidad solo ve su unidad).
- [ ] Contraseñas con hash robusto (argon2 o bcrypt) si hay login propio; límite de intentos.
- [ ] Registro de quién consultó o modificó datos sensibles.

**Organización**
- [ ] Consentimiento informado de representantes para guardar datos del menor.
- [ ] Política de retención: borrar datos de quien deja el grupo.
- [ ] Revisar si ASV tiene una política de protección de datos o de protección infantil aplicable **(no verificado en esta guía)**.
- [ ] Más de una persona de confianza con acceso de emergencia (llaves y contraseñas en un gestor compartido del grupo).

---

## Fuentes

Todas consultadas el 23-sep-2026.

- Contabo VPS: https://contabo.com/en/vps/
- Coolify, instalación: https://coolify.io/docs/get-started/installation
- Coolify, proxies (Traefik por defecto, Caddy opcional): https://coolify.io/docs/knowledge-base/server/proxies
- Coolify, Caddy: https://coolify.io/docs/knowledge-base/proxy/caddy/overview
- Neon, Prisma guide (referencia para Prisma 7 y `prisma.config.ts`): https://neon.com/docs/guides/prisma
- n8n pricing (Community Edition autoalojada gratis): https://n8n.io/pricing/
- Docker, instalación en Ubuntu: https://docs.docker.com/engine/install/ubuntu/ (no reconsultada en esta fecha)
- Caddy, documentación del Caddyfile: https://caddyserver.com/docs/caddyfile (no reconsultada en esta fecha)
- sslip.io: https://sslip.io (no reconsultada en esta fecha)
- DuckDNS: https://www.duckdns.org (no reconsultada en esta fecha)
