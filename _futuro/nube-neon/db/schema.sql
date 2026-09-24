-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Programas Scout — esquema Postgres (Neon / Supabase / local) ║
-- ╚══════════════════════════════════════════════════════════════╝
-- Idempotente: se puede correr varias veces sin romper nada.
-- Requiere Postgres 13+ (gen_random_uuid() viene incluido).

-- Un programa se crea UNA sola vez. Cada guardado posterior es una
-- fila nueva en programa_versiones (historial), nunca un duplicado.
CREATE TABLE IF NOT EXISTS programas (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text NOT NULL UNIQUE,            -- rama-fecha-titulo (fijo desde la creación)
  rama               text NOT NULL CHECK (rama IN ('manada','tropa','comunidad','clan','grupal')),
  titulo             text NOT NULL,
  fecha              date,                            -- fecha de la actividad (inicio)
  fecha_fin          date,
  current_version_id uuid,                            -- FK agregada abajo (referencia circular)
  version_actual     integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  creado_por         text
);

CREATE TABLE IF NOT EXISTS programa_versiones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id   uuid NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
  version       integer NOT NULL CHECK (version > 0),
  contenido     jsonb NOT NULL,                       -- mismo formato que "Exportar datos"
  content_hash  char(64) NOT NULL,                    -- SHA-256 del JSON canónico
  autor         text,                                 -- nombre opcional que escribe el usuario
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,   -- navegador + IP/geo (lado servidor)
  origen        text NOT NULL DEFAULT 'web',          -- 'web' | 'migracion'
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT programa_versiones_num_unica  UNIQUE (programa_id, version),
  CONSTRAINT programa_versiones_hash_unico UNIQUE (programa_id, content_hash)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programas_current_version_fk') THEN
    ALTER TABLE programas
      ADD CONSTRAINT programas_current_version_fk
      FOREIGN KEY (current_version_id) REFERENCES programa_versiones(id)
      ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- Ronda 2: archivado (soft delete) y versiones "sin verificar" (guardadas sin clave).
ALTER TABLE programas          ADD COLUMN IF NOT EXISTS archivado_at  timestamptz;
ALTER TABLE programas          ADD COLUMN IF NOT EXISTS archivado_por text;
ALTER TABLE programa_versiones ADD COLUMN IF NOT EXISTS verificada    boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS programas_activos_idx      ON programas (rama, fecha DESC) WHERE archivado_at IS NULL;
CREATE INDEX IF NOT EXISTS programas_rama_fecha_idx   ON programas (rama, fecha DESC);
CREATE INDEX IF NOT EXISTS programas_fecha_idx        ON programas (fecha DESC);
CREATE INDEX IF NOT EXISTS programas_updated_idx      ON programas (updated_at DESC);
CREATE INDEX IF NOT EXISTS versiones_hash_idx         ON programa_versiones (content_hash);
CREATE INDEX IF NOT EXISTS versiones_programa_idx     ON programa_versiones (programa_id, version DESC);
