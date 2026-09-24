# 01 · Jóvenes: planilla de admisión → base de datos (propuesta)

> **Solo documentación.** No hay tablas creadas ni código. Los ejemplos son **genéricos e inventados**: aquí nunca se copian datos reales de jóvenes ni de representantes.
>
> **Fuente:** `1 Programa de Jovenes/0 Formatos/Planillas/a - Planilla de Admision - Jovenes 2026.xlsx` (versión `V.2025.1`, año `2026`). Se leyó una copia; el original no se tocó.

## Hojas del archivo

| Hoja | Visible | Para qué sirve |
|---|---|---|
| `Instrucciones` | Sí | Instrucciones de llenado y, en celdas auxiliares, las **listas desplegables** (rangos con nombre: `Sexo`, `Unidad`, `Religión`, …) |
| `Información Útil` | Oculta | Planes de cuota (A, B, …) |
| `Planilla` | Sí | Datos personales, historial scout, habilidades, representante y otro progenitor, colaboración, plan de cuota, compromiso, firmas y **historial de progresión** (esta última parte no se imprime) |
| `Ficha Médica` | Sí | Salud, alergias, contacto de emergencia, seguro. La mitad de los datos se copian de `Planilla` con fórmulas |
| `Fotos y Cédulas` | Sí | Espacio para pegar la foto tipo carnet y las cédulas del joven y del representante (imágenes) |

**Obligatoriedad.** El Excel no valida nada como obligatorio, pero sus instrucciones dicen: *«Llena completamente todos los campos… el silencio no es una respuesta»*. En las tablas de abajo, **Sí** = necesario para inscribir; **Cond.** = solo si aplica (según otro campo); **No** = opcional. Es una propuesta: hay que confirmarla con Jefatura.

**Cómo leer la celda.** Es la celda (o el rango combinado) donde se **escribe el dato**; la etiqueta está a su izquierda.

## Campos de la hoja `Planilla`

### Encabezado

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| AY8 | Año de la planilla | entero | Sí | Prellenado `2026` | 2026 |
| AX1 | Versión del formato | texto | — | Fijo `V.2025.1` | V.2025.1 |

### Datos personales (filas 10–17)

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| E11:M11 | C.I. / C.E. | texto | Cond. (muchos niños no tienen cédula) | — | V-00000000 |
| Q11:X11 | 1er. apellido | texto | Sí | — | Pérez |
| AB11:AI11 | 2do. apellido | texto | No | — | Gómez |
| AM11:AT11 | 1er. nombre | texto | Sí | — | Ana |
| AX11:BE11 | 2do. nombre | texto | No | — | Sofía |
| E12:J12 | Fecha de nacimiento | fecha | Sí | — | 2017-03-15 |
| M12:O12 | Edad | entero, **calculado** | — | Fórmula a partir de E12 | 9 |
| S12:W12 | Sexo | enum | Sí | `Sexo`: Masculino, Femenino | Femenino |
| AB12:AI12 | Religión | enum | Sí | `Religión` (19 opciones: Católica, Evangélica, …, Otra) | Católica |
| AN12:AU12 | Escolaridad | enum | Sí | `Escolaridad`: 1er–6to Grado, 1er–6to Año, Básica, Bachiller, Técnico Medio | 4to Grado |
| AZ12:BE12 | Ocupación | enum | No | `Profesión` (61 opciones) | Estudiante |
| E13:K13 | Nacionalidad | enum | Sí | `Nacionalidad` (36 opciones) | Venezolana |
| P13:T13 | Vive con | enum | Sí | `Parentezco`: Madre, Padre, Ambos padres, Abuela, Abuelo, Tía, Tío, Otro familiar | Ambos padres |
| AA13:AE13 | Representante ante el Grupo Scout | enum | Sí | `Representante`: Padre, Madre, Otro | Madre |
| AK13:AW13 | Institución donde estudia | texto | Sí | — | U.E. Colegio Ejemplo |
| BB13:BE13 | ¿Es pública o privada? | enum | Sí | `TipodeInstitución`: Privada, Pública | Privada |
| E14:L14 | Tel. hab. | teléfono | No | — | 0241-0000000 |
| S14:Z14 | Tel. móvil (solo si es del joven) | teléfono | Cond. | — | 0412-0000000 |
| AG14:BE14 | E-mail (solo si es del joven) | email | Cond. | — | joven@example.com |
| E15:BE15 | Dirección de habitación | texto | Sí | — | Calle 1, Casa 2, Urb. Ejemplo |
| D16:S16 | Estado | texto | Sí | Prellenado «Carabobo» | Carabobo |
| W16:AL16 | Municipio | enum | Sí | `Municipios` (15 de Carabobo); prellenado «Valencia» | Valencia |
| AP16:BE16 | Parroquia | enum | Sí | Lista que depende del municipio (`INDIRECT`) | San José |
| I17:P17 | Forma de traslado habitual al grupo | enum | Sí | `Traslado`: A pie, Taxi, Vehículo Particular, Otro | Vehículo Particular |
| Y17:AQ17 | Marca / modelo / color | texto | Cond. (si es vehículo particular) | — | Marca X, modelo Y, gris |
| AU17:BE17 | Placas | texto | Cond. | — | AA000AA |

### Historial scout antes del grupo (filas 18–22)

Hay tres filas iguales: 19 = «Fui lobato / lobezna», 20 = «Fui scout», 21 = «Fui rover».

| Celda (fila 19 / 20 / 21) | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| K19:Q19 / K20:Q20 / K21:Q21 | Grupo | texto | Cond. | — | G.S. Ejemplo |
| U19:AB19 / … | Distrito | texto | Cond. | — | Distrito Ejemplo |
| AF19:AM19 / … | Región | enum | Cond. | `Región` (14) | Carabobo |
| AQ19:AX19 / AQ20:AX20 / AQ21:AX21 | Adelanto | enum | Cond. | `Manada` / `Tropa` / `Clan` (ver catálogo de adelantos) | Huella Ágil |
| BC19:BE19 / … | Año de salida | entero | Cond. | — | 2024 |

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| F22:K22 | Fecha de ingreso al escultismo | fecha | Sí | — | 2024-10-05 |
| Q22:V22 | Fecha de promesa | fecha | Cond. | — | 2025-01-18 |
| AB22:AG22 | Fecha de ingreso a la unidad actual | fecha | Sí | — | 2025-09-20 |
| AM22:AR22 | Unidad actual | enum | Sí | `Unidad`: Manada, Tropa, Clan (**no incluye Comunidad**) | Manada |
| AX22:BE22 | Adelanto actual | enum | Sí | Lista que depende de la unidad (`INDIRECT`) | Huella Alerta |

### Habilidades y organizaciones (filas 23–26)

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| R25:X25, AB25:AH25, AL25:AR25, AV25:BB25 | Habilidad 1–4 | enum | No | `Destrezas` (22: Ajedrez, Campismo, Música, 1ros. Aux., …) | Natación |
| Y25:AA25, AI25:AK25, AS25:AU25, BC25:BE25 | Dominio 1–4 | enum | Cond. | `Dominio`: Inicial, Medio, Alto | Medio |
| AB26:AP26, AQ26:BE26 | Organizaciones juveniles, deportivas, musicales o de acción social | texto (2) | No | — | Club deportivo ejemplo |

### Compromiso del joven (filas 27–28)

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| A27:AH27 | Texto de compromiso (Ley y Promesa) | texto **calculado** | — | Se arma con el nombre | — |
| O28:AH28 | Fecha | fecha, **calculado** | — | `=TODAY()`. **Ojo:** cambia cada vez que se abre el archivo | — |
| AI28:BE28 | Firma del solicitante | firma en papel | Sí | Se imprime y se firma | — |

### Representante (filas 29–33) y otro progenitor (filas 34–38)

Son dos bloques idénticos. Las celdas del otro progenitor están 5 filas más abajo (30→35, 31→36, 32→37, 33→38).

| Celda (repr. / otro) | Etiqueta | Tipo | Oblig. repr. / otro | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| E30:J30 / E35:J35 | C.I. / Pasaporte | texto | Sí / Cond. | — | V-00000000 |
| N30:S30 / N35:S35 | 1er. apellido | texto | Sí / Cond. | — | Pérez |
| W30:AB30 / W35:AB35 | 2do. apellido | texto | No | — | Díaz |
| AF30:AK30 / AF35:AK35 | 1er. nombre | texto | Sí / Cond. | — | María |
| AO30:AT30 / AO35:AT35 | 2do. nombre | texto | No | — | José |
| AY30:BE30 / AY35:BE35 | Nacionalidad | enum | Sí / Cond. | `Nacionalidad` | Venezolana |
| E31:J31 / E36:J36 | Fecha de nacimiento | fecha | Sí / No | — | 1985-01-01 |
| M31:O31 / M36:O36 | Edad | **calculado** | — | Fórmula | 41 |
| S31:W31 / S36:W36 | Edo. civil | enum | No | `Edo._Civil`: Soltero, Casado, Divorciado, Viudo | Casado |
| AB31:AI31 / AB36:AI36 | Nivel de instrucción | enum | No | `Instrucción`: Bachiller … Doctorado | Universitario |
| AN31:AS31 / AN36:AS36 | Profesión u ocupación | enum | No | `Profesión` | Docente |
| AX31:BE31 / AX36:BE36 | Religión | enum | No | `Religión` | Católica |
| E32:L32 / E37:L37 | Tel. hab. | teléfono | No | — | 0241-0000000 |
| Q32:X32 / Q37:X37 | Tel. móvil | teléfono | Sí / Cond. | — | 0414-0000000 |
| AB32:AI32 / AB37:AI37 | Tel. oficina | teléfono | No | — | 0241-0000001 |
| AM32:BE32 / AM37:BE37 | E-mail | email | Sí / Cond. | — | representante@example.com |
| E33:T33 / E38:T38 | Empresa o compañía | texto | No | — | Empresa Ejemplo C.A. |
| Y33:AM33 / Y38:AM38 | Rama empresarial | texto | No | — | Comercio |
| AQ33:BE33 / AQ38:BE38 | Cargo | texto | No | — | Analista |

### Colaboración de los representantes (filas 39–42)

Son casillas: hay que marcar al menos una.

| Celda | Área | Tipo |
|---|---|---|
| K40:L40 | Transporte | booleano |
| V40:W40 | Adultos (captación, selección, formación) | booleano |
| AM40:AN40 | Desarrollo financiero | booleano |
| BD40:BE40 | Subsidio directo (apadrinamiento) | booleano |
| T41:U41 | Aire libre (sitios de campamento) | booleano |
| AI41:AJ41 | Programa (charlas, cursos, talleres) | booleano |
| BD41:BE41 | Relaciones interinstitucionales | booleano |
| K42:L42 | R.R.S.S. | booleano |
| AE42:AF42 | Imagen institucional | booleano |
| AJ42:BC42 (+ BD42:BE42) | Otra (texto) | texto |

### Cuota, consentimiento y visto bueno (filas 43–50)

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla |
|---|---|---|---|---|
| K44:L44 / V44:W44 | Plan de cuota grupal: A / B | enum | Sí | `pagos`: A, B, C, D (la planilla solo muestra A y B) |
| A45:AO45 | Texto de consentimiento del representante | **calculado** | — | Se arma con nombres y C.I. |
| O46:AO46 | Fecha | **calculado** | — | `=TODAY()` |
| AP46:BE46 | Firma del representante | firma en papel | Sí | — |
| C48:W48 / AI48:BC48 | Vº Bº Jefe de Grupo / Jefe de Unidad | firma en papel | Sí | — |

### Historial de progresión (filas 51–113, no se imprime)

| Filas | Sección | Campos | Lista / regla |
|---|---|---|---|
| 52 | Encabezado | Credencial scout, nombre, fecha de nacimiento, fecha de ingreso | — |
| 53–54 | Manada | Fecha de cada adelanto: Huella Fresca, Huella Alerta, Huella Ágil, Huella Libre, Lobo Saltarín | fechas |
| 55–56 | Tropa | Aventurero, Explorador, Pionero, Scout de Bolívar, B.B. | fechas |
| 57–58 | Clan | Precursor, Expedicionario, Descubridor, Fundador, Rover Ciudadano | fechas |
| 59–65 | Especialidades (2 bloques × 5) | Área, descripción, nivel/fecha | `Especialidades` (8 áreas), descripción según el área (`INDIRECT`), `Nivel`: ORO, PLATA, BRONCE |
| 66–72 | Distinciones y condecoraciones | Descripción, fecha | `Distinciones` (18) |
| 73–79 | Participación en CIP (3 × 5) | Evento, nivel/fecha | `CIP`: Grupal, Distrital, Regional, Nacional |
| 80–84 | Programas mundiales | Evento, fecha | — |
| 85–87 | Cursos realizados | Curso, fecha | — |
| 88–98 | Noches de vida al aire libre | Evento, noches/fecha | — |
| 99–113 | Horas de impacto social | Evento, horas/fecha | — |

## Campos de la hoja `Ficha Médica`

Encabezado: el año se copia de `Planilla!AY8`. El nombre, la C.I., la fecha de nacimiento, la edad y el sexo se copian de `Planilla` (D11, Q11, X11, AE11, AJ11).

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| AQ11:AU11 | Grupo sanguíneo | enum | Sí | `Grupo_Sanguíneo`: A/B/AB/O, Rh + o − | O Rh positivo |
| AX11:AY11 | Peso (kg) | decimal | Sí | — | 30 |
| BC11:BD11 | Estatura (cm) | entero | Sí | — | 135 |
| I12:X12 | Persona a contactar en emergencias | texto | Sí | — | Nombre Apellido |
| AC12:AK12 | Parentesco | texto | Sí | — | Tía |
| AN12:AS12 | C.I. del contacto | texto | No | — | V-00000000 |
| AV12:BD12 | Teléfono del contacto | teléfono | Sí | — | 0416-0000000 |
| H14:I14 … BC15:BD15 | Antecedentes (12): rubéola, paperas, paludismo, hepatitis, meningitis, asma, sarampión, varicela, difteria, gastritis, apendicitis, convulsiones | SI/NO ×12 | Sí | `Si_No` | NO |
| A17:AB17 | ¿Padece o ha padecido recientemente alguna enfermedad, trastorno o condición que requiera atención especial? | texto | Sí | — | No |
| AC17:BD17 | ¿Trastorno cardíaco o de la circulación? Explique | texto | Sí | — | No |
| A19:AB19 | ¿Actividades restringidas por razones médicas? ¿Cuáles? | texto | Sí | — | No |
| AC19:BD19 | ¿Restricción de alimentos o bebidas? ¿Cuáles? | texto | Sí | — | Sin lactosa |
| A21:AB21 | ¿Tratamiento farmacológico? Medicamento y dosis | texto | Sí | — | No |
| AC21:BD21 | ¿Condición que requiera acondicionamiento logístico? (neurodiversidad, sordera, limitación visual o motriz, etc.) | texto | Sí | — | No |
| I23:J23 + K23:BD23 | Cirugías: hernias (Sí/No + cuál/cuándo) | SI/NO + texto | Sí | `Si_No` | No |
| I24:J24 + K24:BD24 | Cirugías: fracturas | SI/NO + texto | Sí | — | No |
| I25:J25 + K25:BD25 | Cirugías: otras | SI/NO + texto | Sí | — | No |
| I27:J27 + K27:AB27 | Alergias alimentarias | SI/NO + texto | Sí | — | No |
| I28:J28 + K28:AB28 | Alergias medicamentosas | SI/NO + texto | Sí | — | No |
| AK27:AL27 + AM27:BD27 | Alergias a picaduras de insectos | SI/NO + texto | Sí | — | No |
| AK28:AL28 + AM28:BD28 | Otras alergias | SI/NO + texto | Sí | — | No |
| A31:D31 | ¿Tiene seguro médico, de accidentes o de vida? | SI/NO | Sí | — | Sí |
| E31:AD31 | Compañía aseguradora | texto | Cond. | — | Aseguradora Ejemplo |
| AE31:BD31 | N.º de póliza | texto | Cond. | — | 000-000 |
| A32:AJ34 / AK32:BD32 / AS34:BD34 | Declaración (calculada), firma del representante, fecha (`TODAY()`) | calculado / firma | Sí | — | — |

## Hoja `Fotos y Cédulas`

Imágenes pegadas: foto tipo carnet del joven, cédula del joven (si tiene) y cédula del representante. En la base **no** conviene guardar imágenes dentro de las tablas. Van a un almacenamiento privado (ver *Protección*) y la tabla guarda solo la referencia.

## Observaciones sobre la planilla

- `Edad` y las fechas `=TODAY()` son **calculadas**. En la base se guarda la fecha de nacimiento y la **fecha real de firma**, no la de hoy.
- «Unidad actual» solo ofrece Manada, Tropa y Clan. **Comunidad no existe en la planilla de jóvenes**, aunque sí en la de adultos y en los programas.
- El catálogo de adelantos no es igual en las dos planillas: la de adultos agrega «Cachorro(a)» (Manada) y «Novicio(a)» (Tropa), y el historial de progresión usa «B.B.» y «Rover Ciudadano» (la lista dice «Ciudadano(a)»). Hay que unificarlo en un solo catálogo.
- Hay rangos con nombre rotos (`#REF!`: `Especialiades`, `Identidad`, `Parroquias`, `Turno`, …). No afectan a los campos visibles, pero conviene limpiarlos.

## Esquema SQL propuesto

Postgres (el mismo Neon del proyecto). Las tablas de **personas, unidades y catálogos** se comparten con adultos ([02-adultos.md](02-adultos.md)) y con el informe previo ([03-informe-previo-ip.md](03-informe-previo-ip.md)).

```sql
-- ── Catálogos ─────────────────────────────────────────────
CREATE TABLE catalogo (                 -- listas desplegables del Excel
  tipo    text NOT NULL,                -- 'religion','escolaridad','nacionalidad','municipio','parroquia',
                                        -- 'traslado','destreza','especialidad_area','distincion','cip_nivel', …
  codigo  text NOT NULL,
  nombre  text NOT NULL,
  padre   text,                         -- p. ej. parroquia → municipio, descripción → área de especialidad
  orden   int,
  PRIMARY KEY (tipo, codigo)
);

CREATE TABLE adelantos (                -- progresión por rama
  id      serial PRIMARY KEY,
  rama    text NOT NULL CHECK (rama IN ('manada','tropa','comunidad','clan')),
  nombre  text NOT NULL,                -- 'Huella Fresca', 'Aventurero(a)', 'Precursor(a)', …
  orden   int  NOT NULL,
  UNIQUE (rama, nombre)
);

-- ── Personas (base común de jóvenes, representantes y adultos) ─
CREATE TABLE personas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula            text UNIQUE,         -- NULL si el menor no tiene. Cifrada o con hash (ver Protección)
  tipo_doc          text CHECK (tipo_doc IN ('V','E','P')),
  apellido1         text NOT NULL,
  apellido2         text,
  nombre1           text NOT NULL,
  nombre2           text,
  fecha_nacimiento  date,
  sexo              text CHECK (sexo IN ('M','F')),
  nacionalidad      text,
  religion          text,
  estado_civil      text,
  nivel_instruccion text,
  profesion         text,
  tel_hab           text,
  tel_movil         text,
  tel_oficina       text,
  email             text,
  direccion         text,
  estado            text DEFAULT 'Carabobo',
  municipio         text,
  parroquia         text,
  empresa           text, rama_empresarial text, cargo_laboral text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Unidades y subgrupos (seisenas / patrullas / equipos) ─
CREATE TABLE unidades (
  id      serial PRIMARY KEY,
  rama    text NOT NULL CHECK (rama IN ('manada','tropa','comunidad','clan')),
  nombre  text NOT NULL,                -- p. ej. 'Manada Ejemplo'
  activa  boolean NOT NULL DEFAULT true
);
CREATE TABLE subgrupos (
  id         serial PRIMARY KEY,
  unidad_id  int NOT NULL REFERENCES unidades(id),
  tipo       text NOT NULL CHECK (tipo IN ('seisena','patrulla','equipo','comunidad')),
  nombre     text NOT NULL,             -- 'Seisena Gris', 'Patrulla Halcón', …
  UNIQUE (unidad_id, nombre)
);

-- ── Jóvenes ───────────────────────────────────────────────
CREATE TABLE jovenes (
  persona_id              uuid PRIMARY KEY REFERENCES personas(id) ON DELETE CASCADE,
  credencial_scout        text,
  escolaridad             text,
  institucion             text,
  institucion_tipo        text CHECK (institucion_tipo IN ('Pública','Privada')),
  vive_con                text,
  traslado                text,
  vehiculo                text,         -- marca/modelo/color
  placas                  text,
  fecha_ingreso_escultismo date,
  fecha_promesa           date,
  organizaciones          text[],
  foto_ref                text,         -- ruta a almacenamiento privado, nunca la imagen
  cedula_img_ref          text
);

-- Relación joven ↔ adultos responsables (representante legal, otro progenitor, contacto de emergencia)
CREATE TABLE joven_responsables (
  joven_id       uuid NOT NULL REFERENCES jovenes(persona_id) ON DELETE CASCADE,
  persona_id     uuid NOT NULL REFERENCES personas(id),
  rol            text NOT NULL CHECK (rol IN ('representante','otro_progenitor','emergencia')),
  parentesco     text,                  -- Madre, Padre, Tía, …
  es_representante_ante_grupo boolean NOT NULL DEFAULT false,
  PRIMARY KEY (joven_id, persona_id, rol)
);

-- Pertenencia a unidad y subgrupo en el tiempo (permite historial)
CREATE TABLE joven_unidad (
  id           serial PRIMARY KEY,
  joven_id     uuid NOT NULL REFERENCES jovenes(persona_id) ON DELETE CASCADE,
  unidad_id    int  NOT NULL REFERENCES unidades(id),
  subgrupo_id  int  REFERENCES subgrupos(id),
  cargo        text,                    -- Guía, Subguía, Seisenero, …
  desde        date NOT NULL,
  hasta        date                     -- NULL = actual
);

-- Inscripción anual (una fila por año y persona): plan de cuota, firmas, estado
CREATE TABLE inscripciones (
  id               serial PRIMARY KEY,
  persona_id       uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  anio             int  NOT NULL,
  tipo             text NOT NULL CHECK (tipo IN ('joven','adulto')),
  plan_cuota       text,                -- A, B, C, D
  version_formato  text,                -- 'V.2025.1'
  firmada_solicitante date,
  firmada_representante date,
  vb_jefe_grupo    date,
  vb_jefe_unidad   date,
  estado           text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','completa','rechazada','baja')),
  UNIQUE (persona_id, anio, tipo)
);

-- Autorizaciones y consentimientos (texto aceptado + quién + cuándo)
CREATE TABLE autorizaciones (
  id             serial PRIMARY KEY,
  persona_id     uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,   -- el joven
  otorgada_por   uuid REFERENCES personas(id),                              -- el representante
  tipo           text NOT NULL,        -- 'compromiso_ley_promesa','consentimiento_representante','ficha_medica',
                                       -- 'uso_imagen','actividad' (esta última la usa el IP)
  referencia     text,                 -- p. ej. id del informe previo
  anio           int,
  texto_version  text,                 -- versión del texto aceptado
  firmada_en     date,
  medio          text CHECK (medio IN ('papel','digital'))
);

-- Colaboración ofrecida por los representantes
CREATE TABLE representante_colaboracion (
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  anio       int  NOT NULL,
  area       text NOT NULL,            -- transporte, adultos, desarrollo_financiero, subsidio, aire_libre,
                                       -- programa, relaciones, rrss, imagen, otra
  detalle    text,
  PRIMARY KEY (persona_id, anio, area)
);

-- ── Datos médicos (una ficha por persona y año; se comparte con adultos) ─
CREATE TABLE fichas_medicas (
  id                 serial PRIMARY KEY,
  persona_id         uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  anio               int  NOT NULL,
  grupo_sanguineo    text,
  peso_kg            numeric(5,1),
  estatura_cm        int,
  antecedentes       jsonb NOT NULL DEFAULT '{}',   -- {"asma":false,"varicela":true,…}
  enfermedad_reciente text, trastorno_cardiaco text,
  actividades_restringidas text, restriccion_alimentos text,
  tratamiento        text,               -- medicamento y dosis
  condicion_logistica text,              -- neurodiversidad, movilidad, …
  cirugias           jsonb NOT NULL DEFAULT '{}',   -- {"hernias":{"si":false},"fracturas":{"si":true,"detalle":"…"}}
  alergias           jsonb NOT NULL DEFAULT '{}',   -- alimentarias / medicamentosas / picaduras / otras
  seguro             jsonb,                         -- {"tiene":true,"compania":"…","poliza":"…"}
  firmada_en         date,
  UNIQUE (persona_id, anio)
);
-- Los campos de texto médico se guardan CIFRADOS (ver Protección); aquí se muestran en claro para leer el esquema.

-- ── Progresión y trayectoria ──────────────────────────────
CREATE TABLE historial_scout_previo (   -- antes de entrar al grupo (jóvenes y adultos)
  id          serial PRIMARY KEY,
  persona_id  uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  rama        text NOT NULL,           -- manada, tropa, comunidad, clan, adulto
  grupo       text, distrito text, region text,
  adelanto    text, unidad text,
  anio_salida int
);

CREATE TABLE progresion (               -- adelantos obtenidos
  joven_id     uuid NOT NULL REFERENCES jovenes(persona_id) ON DELETE CASCADE,
  adelanto_id  int  NOT NULL REFERENCES adelantos(id),
  fecha        date NOT NULL,
  PRIMARY KEY (joven_id, adelanto_id)
);

CREATE TABLE especialidades (
  id          serial PRIMARY KEY,
  joven_id    uuid NOT NULL REFERENCES jovenes(persona_id) ON DELETE CASCADE,
  area        text NOT NULL,           -- 8 áreas del catálogo
  descripcion text NOT NULL,
  nivel       text CHECK (nivel IN ('BRONCE','PLATA','ORO')),
  fecha       date
);

CREATE TABLE distinciones (             -- jóvenes y adultos
  id          serial PRIMARY KEY,
  persona_id  uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  fecha       date
);

CREATE TABLE participaciones (          -- CIP, programas mundiales, cursos, noches al aire libre, horas sociales
  id          serial PRIMARY KEY,
  persona_id  uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo        text NOT NULL CHECK (tipo IN ('cip','programa_mundial','curso','noches_aire_libre','horas_impacto')),
  evento      text NOT NULL,
  nivel       text,                    -- Grupal/Distrital/Regional/Nacional (CIP)
  cantidad    numeric,                 -- noches u horas
  cargo       text,                    -- adultos: cargo en el CIP
  fecha       date,
  informe_previo_id uuid               -- enlace opcional al IP (ver 03)
);

CREATE TABLE habilidades (              -- jóvenes y adultos
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  habilidad  text NOT NULL,
  dominio    text CHECK (dominio IN ('Inicial','Medio','Alto')),
  PRIMARY KEY (persona_id, habilidad)
);
```

## Datos sensibles de menores y cómo protegerlos

La planilla junta, en un mismo lugar, datos **de menores de edad** que en Venezuela protege la LOPNNA, y también datos de salud, religión, dirección, teléfonos, fotos y cédulas. Las mismas instrucciones del Excel prometen que *«la información personal del joven y sus padres se manejará de manera confidencial»*. Antes de implementar conviene una revisión con Jefatura (y, si es posible, con alguien con criterio legal).

### Clasificación

| Nivel | Datos | Quién debería verlos |
|---|---|---|
| **Público interno** | Nombre de pila + inicial del apellido, rama, unidad, subgrupo, adelanto | Dirigentes de la unidad |
| **Personal** | Nombre completo, fecha de nacimiento, escuela, habilidades, historial scout, progresión | Dirigentes de **su** unidad + Jefatura |
| **Contacto** | Dirección, teléfonos, e-mails del joven y de los representantes, contacto de emergencia | Dirigentes de su unidad + Jefatura; en un IP, solo los del evento |
| **Sensible** | C.I., ficha médica completa, religión, fotos y cédulas, seguro | Jefe de la unidad + Jefatura. En actividades, un **resumen de salud** (alergias, medicación, restricciones) para el responsable |

### Acceso con las claves actuales: no alcanza

Las claves del sistema de programas (`READ_KEY`, `EDIT_KEY`, `ADMIN_KEY`) son **compartidas**: no identifican a la persona y no distinguen unidades. Sirven para programas, **no para datos de menores**. La propuesta:

1. **Cuentas individuales** para los dirigentes (Neon + un proveedor de autenticación, o Supabase Auth), con roles `jefatura`, `jefe_unidad`, `dirigente`, `admin` y la **unidad** asignada.
2. Toda la consulta de personas pasa por la API y aplica el filtro de unidad (o *Row-Level Security* en Postgres).
3. Si se quiere empezar sin cuentas, como mínimo: una clave aparte `DATOS_KEY`, distinta de las de programas, que solo tenga Jefatura; la ficha médica completa, solo con `ADMIN_KEY`; y nunca exponer estos datos con `READ_KEY`.
4. **Registro de accesos** (`auditoria`: quién, qué persona, qué campo, cuándo) para cada lectura de datos sensibles o de contacto.

### Cifrado

- **En tránsito:** HTTPS (Vercel) y `sslmode=require` hacia Neon. Ya ocurre.
- **En reposo:** Neon cifra el disco. Además, los campos sensibles (C.I., textos médicos, seguro, teléfonos) se cifran **a nivel de columna** con `pgcrypto` (`pgp_sym_encrypt`) o, mejor, en la API con una clave que vive en una variable de entorno (`DATOS_CIFRADO_KEY`) y **nunca** en el repo ni en la base.
- **Búsqueda por C.I.:** se guarda además un *hash* con sal (`cedula_hash`), para detectar duplicados sin guardar la cédula en claro.
- **Fotos y cédulas:** en un almacenamiento privado (por ejemplo, Vercel Blob privado o Supabase Storage con políticas), con enlaces temporales firmados. Nunca en `images/` ni en el repo.

### Retención

- La inscripción y la ficha médica **valen un año** (lo dice la nota de la planilla). Al cerrar el año, la ficha médica anterior se archiva y, pasado un plazo (por ejemplo 1 año), se **borra**. Solo se conserva la del año en curso.
- Personas que se dan de baja: se conserva el historial scout y la progresión (valor institucional), y a los **N años** se eliminan los datos de contacto, médicos y las imágenes. El plazo lo decide Jefatura.
- Si un representante pide borrar los datos, hay que poder hacerlo (borrado en cascada desde `personas`).

### Reglas del repositorio

- **Nunca** se suben datos reales al repo público (ni seeds, ni fixtures, ni capturas). Para desarrollar se usan datos **sintéticos**.
- Las exportaciones (Excel o PDF) con datos personales se generan bajo demanda y no se guardan en carpetas públicas.
