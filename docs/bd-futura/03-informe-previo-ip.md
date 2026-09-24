# 03 · Informe Previo (IP) generado desde un programa (propuesta)

> **Solo documentación.** No se implementa nada. Los ejemplos son genéricos; no se copian nombres, cédulas ni teléfonos reales de los formatos.
>
> **Fuentes** (se leyeron copias; los originales no se tocaron):
> - **Formato de grupo:** `1 Programa de Jovenes/0 Formatos/Salidas/Informe Previo de Actividades Scouts (V LSG - feb 2026).xlsx`, versión «V. Grupo 2025 2.0». Sirve para salidas de **una unidad**.
> - **Formato de evento:** `IP Waingunga - (…).xlsx` (se omite el resto del nombre del archivo porque incluye el nombre de una participante), versión «V. Evento 2026 1.0». Sirve para un **evento distrital (CIP)**, e incluye fichas de inscripción por joven, adulto, patrulla y manada.

## 1. Estructura de los dos formatos

| Hoja | Formato de grupo (V. Grupo 2025 2.0) | Formato de evento (V. Evento 2026 1.0) |
|---|---|---|
| `Instrucciones` | Cómo llenarlo. Además, la tabla `datos` con los adultos del grupo (unidad, nombre, cargo, teléfono, C.I., e-mail), que las fórmulas consultan con `VLOOKUP` | Las instrucciones están al pie de `I.P.` (filas 57–78) |
| `I.P.` | Detalle de la actividad (página 1) | Detalle del evento |
| `Autorización` | Circular para representantes + desprendible de autorización | — |
| `Asistentes` | Listado de jóvenes con checklist (pago, autorización, LOPNA, ficha médica, abordó). **Una planilla por unidad asistente** | — |
| `Listado Distrito` | Resumen para enviar al distrito: salida/regreso, lugares, hasta 50 jóvenes y 14 adultos | — |
| `Indicadores de Logro` | Los I.L. de las 6 etapas (mismo texto que el IP Waingunga; ver [indicadores-de-logro.md](../indicadores-de-logro.md)) | Hojas `I.L. Manada`, `I.L. Tropa`, `I.L. Clan` |
| Inscripciones | — | `Inscripción joven`, `Inscripción adulto scout` (ficha de inscripción y ficha médica del evento), `Inscripción Patrulla`, `Inscripción Manada` (integrantes + adulto acompañante + firmas) |

## 2. Todos los campos del IP

**Leyenda de la columna «Origen»:**
- **P** = se toma del **programa guardado** (automático, editable).
- **P?** = se puede **proponer** desde el programa, pero hay que revisarlo.
- **J / A** = sale de las tablas de **jóvenes** o **adultos** (ver [01](01-jovenes.md) y [02](02-adultos.md)).
- **M** = hay que **pedirlo aparte** (manual).
- **C** = calculado.

### 2.1 Formato de grupo, hoja `I.P.`

| Celda | Campo | Tipo | Origen | De dónde sale / nota |
|---|---|---|---|---|
| L2:P2 | RAMA | enum | **P** | `programas.rama` (lista del Excel: `Unidad` = Manada, Tropa, Clan) |
| C4:K4 | Actividad | texto | **P** | `_data['nombre-act']` |
| M4:O4 | Fecha | fecha | **P** | `_fechaIni` (y `_fechaFin` si es de varios días) |
| D6:H6 | (1.1.1) Lugar de salida | texto | **M** | El programa solo tiene el lugar de la actividad (`_data.lugar`), no el punto de concentración |
| D7:H7 | (1.1.2) Fecha de salida | fecha | **P?** | `_fechaIni` |
| D8:H8 | (1.1.3) Hora de salida | hora | **P?** | `_hora_ini`, o la hora del primer momento del programa. Normalmente es **antes** del inicio de la actividad |
| L6:P6 | (1.2.1) Lugar de regreso | texto | **M** | Suele ser el mismo lugar de salida |
| L7:P7 | (1.2.2) Fecha de regreso | fecha | **P?** | `_fechaFin` |
| L8:P8 | (1.2.3) Hora de regreso | hora | **P?** | `_hora_cierre` (con margen para el traslado) |
| A11–A14 (+B–E) | (1.3.1) Sitios a visitar: lugar principal y lugares 2–4, con fecha y hora de inicio y culminación | texto + fechas y horas | **P?** / **M** | Nombre del lugar principal ← `_data.lugar`. Fechas y horas ← el programa. Los lugares 2–4 son manuales |
| F11:J14 | (1.3.2) Dirección exacta o coordenadas | texto | **M** | Código Plus o enlace de mapa |
| K11:L14 | (1.3.3) Municipio | texto | **M** | — |
| M11:N14 | (1.3.4) Estado | texto | **M** | — |
| O11:P14 | (1.3.5) Medio de transporte | texto | **M** | Particular, autobús, a pie, … |
| A17:P19 | (1.5) Sitios no indicados en (1.3) o separación del grupo: lugar, quiénes, medios de comunicación, medios de transporte | texto ×4 | **M** | Hasta 3 filas |
| A22:H23 | (1.6) Persona contactada en la zona a visitar: nombre, teléfono | texto | **M** | — |
| I22:P23 | (1.7) Persona contacto en Valencia: nombre, teléfono | texto | **M** / **A** | Puede ser un adulto del grupo que no asiste |
| A26:P31 | (2.1) Adultos de la unidad asistentes: nombre, C.I., cargo, teléfono en el evento, correo (6 filas) | texto | **P?** + **A** | Nombres ← responsables del programa (`_data.responsable` y la columna `resp` de `_prog`). C.I., cargo, teléfono y correo ← tabla `adultos` (hoy es un `VLOOKUP` a la tabla `datos` de `Instrucciones`) |
| A34:P47 | (2.2) Invitados (toda persona adulta que no es de la unidad): nombre, C.I., cargo, función en el evento, teléfono (14 filas) | texto | **M** / **A** | Si el invitado es adulto del grupo, se completa desde `adultos` |
| E49:P49 | (3.1) Tipos de actividades que se realizarán | texto | **P** | Lista de `_prog[].act` (nombres de los momentos) |
| A52 | (3.2) Costo estimado por persona | moneda | **M** | — |
| E51:L52 | Este costo cubre | texto | **M** | — |
| M51:N52 | Entrega programa | SI/NO | **C** | «Sí» si el IP se genera desde un programa guardado (se puede adjuntar el PDF del programa) |
| O51:P52 | Entrega presupuesto | SI/NO | **M** | — |
| A54 / F54 / L54 | (3.3) Indicadores de logro (**solo 3 espacios**) | texto | **P** | `_ind[].texto`. Si el programa tiene más de 3, se eligen 3 (ver §4) |
| C56 | (3.4.1) Cantidad de visitas preparativas previas | entero | **M** | — |
| E56:J56 | (3.4.2) Medidas de desalojo previstas | texto | **M** | Gestión de riesgos |
| L56:P56 | (3.4.3) Primeros auxilios | texto | **M** | — |
| B58:H58 | (3.5.1) Equipo sugerido | texto | **P?** | Se puede proponer a partir de `_prog[].mat` (son materiales del staff: revisar) |
| J58:P58 | (3.5.2) Menú sugerido | texto | **M** | — |
| B60:H60 (+F60) | (4.1) Responsable de la actividad: nombre (+ teléfono calculado) | texto | **P** + **A** | `_data.responsable` → `adultos` |
| J60:M60 (+N60) | (4.2) Jefe o Subjefe de Grupo: nombre (+ teléfono) | texto | **A** | Adulto con cargo Jefe o Subjefe de Grupo |
| B61 / J61 | Firmas | firma | **M** | En papel. Hoy estas celdas muestran `#VALUE!` |

### 2.2 Formato de grupo, hojas `Autorización`, `Asistentes` y `Listado Distrito`

| Hoja | Campo | Origen |
|---|---|---|
| `Autorización` | Salida y regreso, lugares, transporte, contacto en la ciudad, cantidad de adultos (de la unidad / otros), tipos de actividades, costo, equipo, menú, firmas del responsable y del Jefe de Grupo | **C** (todo se copia de `I.P.`) |
| `Autorización` (desprendible) | «Yo, ___, C.I. ___, representante de ___, C.I. ___», actividad y días, lugar, actividades, **adultos acompañantes**, firma, **teléfonos de emergencia** | **J**: representante (`joven_responsables`) + joven. Se genera **una por joven asistente** |
| `Asistentes` | N.º, nombre y apellido, teléfono del representante, pago, fecha, autorización, LOPNA, ficha médica, abordó | **J** (nombre, teléfono del representante; ficha médica = existe `fichas_medicas` del año) + **M** (checklist del día) |
| `Listado Distrito` | Salida y regreso, lugares, hasta 50 jóvenes (nombre completo), hasta 14 adultos (nombre, teléfono, cargo o función) | **C**. **Ojo:** la fórmula solo lista a un joven si la columna **PAGO** de `Asistentes` dice «si» |

### 2.3 Formato de evento, hoja `I.P.` (diferencias con el de grupo)

| Celda | Campo | Origen | Nota |
|---|---|---|---|
| L2:P2 | RAMA | **P** | Lista `RAMA`: MANADA, TROPA, COMUNIDAD, CLAN (en mayúsculas) |
| C4:K4 / M4:O4 | Nombre del evento / fecha(s) | **P** | — |
| A11 | «CAMPAMENTO BASE» en lugar de «LUGAR PPAL», hasta 5 lugares | **P?** / **M** | — |
| A20:P32 | (3.1) **Staff adulto organizador**: nombre, C.I., **función** (Asesor, Administración, Especialista, Logística, Operaciones…), teléfono, correo, más «Adulto acompañante» | **A** + **M** | La función es del evento, no el cargo del adulto |
| A34:P42 | (3.2) Adultos invitados: nombre, **institución u organización**, función | **M** | — |
| E44:P44 | (4.1) **Descripción del evento** | **P?** | `_data.oportunidad` / `_data['obj-general']` |
| E45:P45 | (4.2) Tipos de actividades | **P** | `_prog[].act` |
| B46:P47 | (4.3) Indicadores de logro (**8 espacios**) | **P** | `_ind` |
| A50 / E49:P50 | (4.4) Costo (por ejemplo, distinto para jóvenes y adultos) / qué cubre | **M** | — |
| C52 / E52:J52 / L52:P52 | (4.5) Gestión de riesgos: visitas previas, gestión de riesgos prevista, primeros auxilios | **M** | — |
| B54:H54 / J54:P54 | (4.6) Equipo recomendado / menú | **P?** / **M** | — |
| B55:F55 / M55:P55 | Adulto responsable del evento: nombre, C.I., firma | **P** + **A** | — |
| Inscripción joven | Datos personales, grupo, distrito, región, **adelanto**, representante, jefe de unidad y ficha médica del evento | **J** | Una por joven. Es un subconjunto de la planilla de admisión + ficha médica |
| Inscripción adulto scout | Datos personales, cargo, nivel de formación, supervisor scout, ficha médica | **A** | Una por adulto |
| Inscripción Patrulla / Manada | Nombre y grupo, integrantes (cargo Guía/Subguía, apellidos, nombres, C.I., fecha de nacimiento, edad, adelanto), adulto acompañante, firmas (Guía, Jefe de Unidad, Jefe de Grupo, adulto) | **J** (`joven_unidad` + `subgrupos` + `progresion`) + **A** | Una por patrulla o seisena / manada |

## 3. Qué sale del programa y qué hay que pedir aparte

| Sale **automáticamente** del programa guardado | Hay que **pedirlo aparte** |
|---|---|
| Rama (`programas.rama`, `_rama`) | Lugar de salida y de regreso (punto de concentración) |
| Nombre de la actividad (`nombre-act`) | Dirección exacta o coordenadas, municipio y estado de cada sitio |
| Fechas (`_fechaIni`, `_fechaFin`) | Medio de transporte (y sitios fuera del recorrido) |
| Horas de inicio y cierre (`_hora_ini`, `_hora_cierre`; propuestas para salida y regreso) | Personas de contacto en la zona y en la ciudad |
| Lugar principal (solo el nombre: `_data.lugar`) | Invitados externos (nombre, C.I., institución, función) |
| Tipos de actividades (`_prog[].act`) | Costo por persona, qué cubre, entrega de presupuesto |
| Descripción (`oportunidad`, `obj-general`) | Visitas previas, medidas de desalojo o gestión de riesgos, primeros auxilios |
| Indicadores de logro (`_ind`) | Menú |
| Responsable (`_data.responsable`) y staff (`_prog[].resp`) → datos completos desde `adultos` | **Participantes**: qué jóvenes van (se eligen de `jovenes` filtrando por unidad) y su checklist (pago, autorización, LOPNA, ficha médica, abordó) |
| Equipo sugerido (propuesto desde `_prog[].mat`) | Jefe o Subjefe de Grupo que firma y las firmas en papel |

Los campos manuales se guardan en el propio IP (`informes_previos`), así se reutilizan: por ejemplo, el mismo lugar con sus coordenadas en el próximo IP.

## 4. Cómo generar el IP desde un programa

1. En `programas.html`, un botón «📝 Generar IP» en el programa (solo para `EDIT_KEY`/`ADMIN_KEY` o cuentas con rol).
2. Se crea un **borrador de IP** (`informes_previos`) enlazado a la **versión** concreta del programa (`programa_version_id`). Si el programa cambia después, el IP avisa: «el programa tiene una versión más nueva».
3. Se precargan los campos **P** y **P?**. El formulario pide los **M** y deja elegir participantes (jóvenes) y staff (adultos).
4. **Indicadores de logro:** el formato de grupo tiene **3 espacios** y el de evento **8**. Si el programa tiene más, se muestran todos con una casilla y se preseleccionan los primeros (idealmente uno por área). No se trunca el texto.
5. Se generan los documentos (§6).

### 4.1 ¿IP por unidad o grupal?

Se decide según **a quién va dirigida la actividad**, usando `programas.rama` y `_grupal_comunidad`:

| Programa | IP que se genera |
|---|---|
| `rama` = `manada` / `tropa` / `comunidad` / `clan` | **1 IP de unidad**, con RAMA = esa rama, 1 hoja `Asistentes` y 1 autorización por joven de esa unidad |
| `rama` = `grupal`, `_grupal_comunidad` = `false` | **IP grupal**: un solo `I.P.` con RAMA = «Grupal» (o las ramas participantes), y **una hoja `Asistentes` por unidad**: Manada, Tropa y Clan. El formato lo pide así: *«Elabore una planilla de este ejemplar por cada unidad del grupo asistente»* |
| `rama` = `grupal`, `_grupal_comunidad` = `true` | Igual que el anterior, **agregando Comunidad** |
| Evento distrital (CIP) | Formato de **evento**. RAMA = la rama destinataria del evento, más las inscripciones por joven, adulto y patrulla/manada |

Para la lista de RAMA: el formato de grupo solo ofrece Manada, Tropa y Clan. Para los IP grupales habría que agregar «Grupal» a la lista o escribir las ramas participantes. **Pendiente de decidir con Jefatura.**

## 5. Relación con las tablas de jóvenes y adultos

```sql
CREATE TABLE informes_previos (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id          uuid REFERENCES programas(id),
  programa_version_id  uuid REFERENCES programa_versiones(id),
  formato              text NOT NULL CHECK (formato IN ('grupo','evento')),  -- V. Grupo 2025 2.0 / V. Evento 2026 1.0
  alcance              text NOT NULL CHECK (alcance IN ('unidad','grupal')),
  ramas                text[] NOT NULL,                  -- {'manada'} o {'manada','tropa','clan'[, 'comunidad']}
  nombre               text NOT NULL,
  fecha_ini            date NOT NULL, fecha_fin date,
  salida               jsonb,     -- {"lugar","fecha","hora"}
  regreso              jsonb,
  descripcion          text,
  tipos_actividades    text,
  costo                jsonb,     -- {"monto","moneda","cubre","por":"persona|joven|adulto"}
  entrega_programa     boolean, entrega_presupuesto boolean,
  seguridad            jsonb,     -- {"visitas_previas","desalojo","primeros_auxilios"}
  equipo_sugerido      text, menu text,
  responsable_id       uuid REFERENCES personas(id),   -- adulto responsable
  jefatura_id          uuid REFERENCES personas(id),   -- Jefe o Subjefe de Grupo
  estado               text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviado','aprobado','realizado','cancelado')),
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ip_lugares (       -- (1.3) y (1.5)
  id serial PRIMARY KEY, ip_id uuid NOT NULL REFERENCES informes_previos(id) ON DELETE CASCADE,
  orden int, tipo text CHECK (tipo IN ('principal','sitio','fuera_recorrido')),
  nombre text, direccion text, municipio text, estado text, transporte text,
  inicio timestamptz, fin timestamptz, quienes text, comunicacion text
);
CREATE TABLE ip_contactos (     -- (1.6) zona y (1.7) ciudad
  id serial PRIMARY KEY, ip_id uuid NOT NULL REFERENCES informes_previos(id) ON DELETE CASCADE,
  tipo text CHECK (tipo IN ('zona','ciudad')), persona_id uuid REFERENCES personas(id),
  nombre text, telefono text                     -- si es externo y no está en personas
);
CREATE TABLE ip_adultos (       -- (2.1) adultos de la unidad / staff, (2.2) invitados
  ip_id uuid NOT NULL REFERENCES informes_previos(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES personas(id),
  rol text NOT NULL CHECK (rol IN ('unidad','staff','invitado','acompanante')),
  funcion text, institucion text, telefono_evento text,
  nombre_externo text, cedula_externa text,     -- invitados que no están en personas
  PRIMARY KEY (ip_id, persona_id, rol)
);
CREATE TABLE ip_indicadores (   -- (3.3) / (4.3)
  ip_id uuid NOT NULL REFERENCES informes_previos(id) ON DELETE CASCADE,
  orden int NOT NULL, area text, etapa text, texto text NOT NULL,
  PRIMARY KEY (ip_id, orden)
);
CREATE TABLE ip_asistentes (    -- hoja Asistentes (una lista por unidad)
  ip_id uuid NOT NULL REFERENCES informes_previos(id) ON DELETE CASCADE,
  joven_id uuid NOT NULL REFERENCES jovenes(persona_id),
  unidad_id int REFERENCES unidades(id),
  pago boolean, fecha_pago date,
  autorizacion_id int REFERENCES autorizaciones(id),  -- de 01: tipo 'actividad'
  lopna boolean, ficha_medica_ok boolean,             -- ficha_medica_ok = hay ficha del año
  abordo boolean,
  PRIMARY KEY (ip_id, joven_id)
);
```

- **Responsables y staff** (`ip_adultos`, `responsable_id`, `jefatura_id`) → `personas` + `adultos` + `adulto_cargos`. Esto reemplaza el `VLOOKUP` a la tabla `datos` del Excel.
- **Participantes** (`ip_asistentes`) → `jovenes`, filtrados por `joven_unidad` (unidad vigente en la fecha del IP).
- **Autorizaciones** → `autorizaciones` (tipo `actividad`, `referencia` = id del IP), firmadas por el representante (`joven_responsables` con `es_representante_ante_grupo`).
- **Ficha médica** → solo un *check* («tiene ficha del año») y, para el responsable, un **resumen** (alergias, medicación, restricciones). Nunca la ficha completa en el IP.
- **Participación** → al pasar el IP a «realizado», se pueden crear filas en `participaciones` (CIP, noches al aire libre, horas de impacto) para cada asistente.

## 6. Formato de salida (propuesta)

| Opción | Cómo | Ventajas | Desventajas |
|---|---|---|---|
| **A. Rellenar la plantilla `.xlsx` oficial** | Una función en el servidor abre una copia de la plantilla (guardada en privado), escribe las celdas de §2 y la descarga. Librería `exceljs`, que conserva formatos y fórmulas | Es **el formato que espera el distrito** (el Listado Distrito se envía en Excel); las fórmulas internas (Autorización, Listado) siguen funcionando | Hay que mantener el mapa de celdas si cambia la versión del formato; las imágenes y las firmas siguen siendo en papel |
| **B. Generar PDF** | Una página HTML imprimible (como la ficha actual) con el mismo contenido, o un PDF generado en el servidor | Se ve igual en cualquier equipo; ideal para la **circular a representantes** (`Autorización`) y para compartir por WhatsApp | No es editable; el distrito puede exigir el Excel |
| **C. Ambas** (recomendada) | `.xlsx` para Jefatura y distrito + PDF de la circular para los representantes | Cubre los dos usos | Más trabajo |

Recomendación: empezar por **A** (con la versión del formato como parámetro: `V. Grupo 2025 2.0`) y la circular en **PDF**. Las plantillas `.xlsx` se guardan en almacenamiento privado, no en el repo, porque las actuales traen datos reales en `Instrucciones` y en el ejemplo precargado.

## 7. Observaciones sobre los formatos

- El formato de grupo que se revisó **trae datos reales precargados**: la tabla `datos` con adultos del grupo en `Instrucciones`, y una actividad de ejemplo con jóvenes y adultos. Antes de usarlo como plantilla hay que **vaciarlo**.
- `B61` / `J61` (firmas) muestran `#VALUE!`.
- `Listado Distrito` solo incluye a los jóvenes con «PAGO = si». Hay que confirmar si es intencional (¿un joven que no pagó no va?).
- El IP de evento pone las I.L. con redacciones que no coinciden con las hojas I.L. del mismo archivo (ver [indicadores-de-logro.md](../indicadores-de-logro.md#datos-faltantes-o-ambiguos)). Al generarlo desde un programa, los textos serán siempre los oficiales.
