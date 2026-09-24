# 02 · Adultos: planilla de admisión → base de datos (propuesta)

> **Solo documentación.** No hay tablas creadas ni código. Los ejemplos son **genéricos e inventados**: aquí nunca se copian datos reales de adultos.
>
> **Fuente:** `3 Adultos en el Movimiento/0 Formatos/a - Planilla de Admision - Adultos 2026.xlsx` (año `2026`). Se leyó una copia; el original no se tocó.
>
> **Ejemplo de mapeo con una planilla llenada:** existe una ficha privada, **fuera del repositorio**, que muestra cómo cada celda de una planilla individual real corresponde a un campo de este esquema. Por privacidad no se enlaza ni se copia aquí. Pídesela a Jefatura o al mantenedor del proyecto.

## Hojas del archivo

| Hoja | Visible | Para qué sirve |
|---|---|---|
| `Instrucciones` | Sí | Instrucciones y listas desplegables (rangos con nombre) |
| `Hoja1` | Oculta | **Catálogo de cargos**: por cada cargo, sus *Funciones*, *Actividades principales*, *Requerimientos de la instancia*, *Metas de formación* y *Apoyo por suministrar*. Lo usa el `Acuerdo Mutuo` |
| `Planilla` | Sí | Datos personales, laborales, referencias, historial scout, cargo, habilidades, compromiso y **historial de formación y reconocimientos** |
| `Acuerdo Mutuo` | Sí | Acuerdo anual entre el adulto, su asesor personal de formación y su supervisor (Jefe de Grupo) |
| `Ficha Médica` | Sí | Igual que la de jóvenes, con pequeñas diferencias (ver abajo) |
| `Fotos y Cédulas` | Sí | Foto y cédula (imágenes) |

**Obligatoriedad:** igual que en la planilla de jóvenes, es una **propuesta** (el Excel no valida). **Sí** = necesario, **Cond.** = según otro campo, **No** = opcional.

## Campos de la hoja `Planilla`

### Datos personales (filas 10–17)

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| C11:I11 | C.I. | texto | Sí | — | V-00000000 |
| M11:Q11 | 1er. apellido | texto | Sí | — | Rodríguez |
| U11:Y11 | 2do. apellido | texto | No | — | Silva |
| AC11:AG11 | 1er. nombre | texto | Sí | — | Luis |
| AK11:AO11 | 2do. nombre | texto | No | — | Alberto |
| AT11:AY11 | Nacionalidad | enum | Sí | `Nacionalidad` | Venezolana |
| BB11:BE11 | Edo. civil | enum | Sí | `Edo._Civil`: Soltero, Casado, Divorciado, Viudo | Soltero |
| E12:J12 | Fecha de nacimiento | fecha | Sí | — | 1990-01-01 |
| M12:O12 | Edad | **calculado** | — | Fórmula | 36 |
| S12:W12 | Sexo | enum | Sí | `Sexo`: Masculino, Femenino | Masculino |
| AB12:AI12 | Nivel de instrucción | enum | Sí | `NiveldeInstrucción` (20: 1er Grado … Doctorado) | Universitario |
| AN12:AS12 | Ocupación | enum | Sí | `Profesión` (57) | Docencia |
| AX12:BE12 | Religión | enum | No | `Religión` | Católica |
| D13:L13 | Tel. hab. | teléfono | No | — | 0241-0000000 |
| P13:X13 | Tel. móvil | teléfono | Sí | — | 0414-0000000 |
| AB13:AJ13 | Tel. móvil (2.º) | teléfono | No | — | 0424-0000000 |
| AN13:BE13 | E-mail | email | Sí | — | adulto@example.com |
| E14:BE14 | Dirección de habitación | texto | Sí | — | Av. Ejemplo, Casa 1 |
| D15:N15 / S15:AE15 / AJ15:AW15 | Estado / Municipio / Parroquia (1.ª fila) | texto / enum / enum | Sí | Estado prellenado «Carabobo»; `Municipios`; parroquia según el municipio | Carabobo / Valencia / San José |
| BA15:BE15 | Código postal | **calculado** | — | `VLOOKUP(parroquia)` | 2001 |
| D16:S16 / W16:AL16 / AP16:BE16 | Estado / Municipio / Parroquia (**2.ª fila, repetida**) | texto / enum / enum | ? | Ver *Observaciones* | — |
| M17:T17 | Vehículo: marca | texto | Cond. | — | Marca X |
| Y17:AH17 | Vehículo: modelo | texto | Cond. | — | Modelo Y |
| AL17:AS17 | Vehículo: color | texto | Cond. | — | Gris |
| AW17:BE17 | Vehículo: placas | texto | Cond. | — | AA000AA |

### Datos laborales y estudios (filas 18–22)

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| E19:AH19 | Trabaja en | texto | No | — | Empresa Ejemplo C.A. |
| AL19:BE19 | Cargo | texto | No | — | Analista |
| E20:H20 | Antigüedad | texto | No | Texto libre (p. ej. «2 años») | 2 años |
| O20:AM20 | Ramo de trabajo | texto | No | — | Servicios |
| AT20:BE20 | Teléfono del trabajo | teléfono | No | — | 0241-0000002 |
| H21:BE21 | Dirección del trabajo | texto | No | — | Zona industrial, galpón 3 |
| D22:E22 | ¿Estudia? | SI/NO | Sí | `Si_No` | No |
| I22:X22 | ¿Dónde? | texto | Cond. | — | Universidad Ejemplo |
| AD22:AR22 | Carrera | texto | Cond. | — | Ingeniería |
| AV22:BE22 | Horario | enum | Cond. | `Turno`: Mañana, Tarde, Noche, Corrido | Noche |

### Referencias (filas 23–29): 6 personas

| Fila | Tipo de referencia | Campos (celdas) | Ejemplo genérico |
|---|---|---|---|
| 24, 25 | Familiar que **no** vive con el adulto | Nombre K:AA · Parentesco AF:AM · Edad AP:AS · Tel. cel. AW:BE | Nombre Apellido · Primo · 40 · 0412-0000000 |
| 26, 27 | No familiar | Nombre E:U · Se conocen (años) AC:AE · Relación AI:AM · Edad AP:AS · Tel. cel. AW:BE | Nombre Apellido · 5 · Amistad · 35 · 0416-0000000 |
| 28, 29 | Scout | Nombre E:U · Se conocen (años) AC:AE · Grupo AI:AM · Edad AP:AS · Tel. cel. AW:BE | Nombre Apellido · 3 · G.S. Ejemplo · 28 · 0424-0000000 |

Son datos de **terceros**: requieren el mismo cuidado que los del adulto (ver *Protección*).

### Historial scout (filas 30–41)

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla | Ejemplo genérico |
|---|---|---|---|---|---|
| Filas 31–34 | Fui lobato / scout / caminante / rover: Grupo K:Q · Distrito U:AB · Región AF:AM · Último adelanto AQ:AX · Año de salida BC:BE | texto / enum | Cond. | `Región`; adelantos `Manada` (incluye «Cachorro(a)»), `Tropa` (incluye «Novicio(a)»), `Clan` | G.S. Ejemplo · Distrito Ejemplo · Carabobo · Pionero(a) · 2008 |
| Filas 35–37 | Fui adulto scout (×3): Grupo · Distrito · Región · **Unidad** AQ:AX · Año de salida | texto / enum | Cond. | `Unidades`: Manada, Tropa, Comunidad, Clan, Grupo | G.S. Ejemplo · … · Tropa · 2020 |
| G38:L38 | Unidad en la que se desempeña | enum | Sí | `Unidades` (incluye **Comunidad** y **Grupo**) | Manada |
| P38:AB38 | Cargo | enum | Sí | `Cargo`: Adulto de Programa, Representante de Unidad, Jefe de Grupo, Subjefe de Grupo, Rptte. de Inst. Patrocinadora, Adulto Colaborador | Adulto de Programa |
| AJ38:AS38 | Nivel de formación alcanzado para su cargo | enum | Sí | `Capacitacion` (23) | Iniciación |
| AX38:BE38 | Otros niveles de formación | texto | No | — | Taller de Gestión de Riesgos y Seguridad |
| F39:K39 | Fecha de ingreso al escultismo | fecha | Sí | — | 2005-01-01 |
| R39:W39 | Fecha de ingreso al grupo | fecha | Sí | — | 2024-09-01 |
| AC39:AH39 | Fecha de promesa | fecha | Cond. | — | 2005-06-01 |
| AO39:AT39 | Fecha de ingreso como adulto scout | fecha | Sí | — | 2024-09-01 |
| AZ39:BE39 | Fecha de ingreso a la unidad actual | fecha | Sí | — | 2024-09-01 |
| J40:BE40 | Responsabilidades scouts asumidas anteriormente | texto | No | — | Adulto de Programa en Tropa |
| J41:K41 | ¿Tiene hijos en el movimiento? | SI/NO | Sí | `Si_No` | No |
| P41:Q41 | ¿Cuántos? | entero | Cond. | — | 1 |
| X41:AL41 | ¿En qué unidades? | texto | Cond. | — | Manada |
| AX41:BE41 | Otros familiares en el movimiento | texto | No | — | — |

### Habilidades, organizaciones y compromiso (filas 42–49)

| Celda | Etiqueta | Tipo | Oblig. | Lista / regla |
|---|---|---|---|---|
| R44, Z44, AH44, AP44, AX44 (+ dominio en W44, AE44, AM44, AU44, BC44) | Habilidad 1–5 + dominio | enum | No | `Destrezas` (22), `Dominio`: Inicial, Medio, Alto |
| AB45, AH45, AN45, AT45, AZ45 | Organizaciones (5) | texto | No | — |
| A46:AH46 | Declaración de Ley y Promesa | **calculado** | — | Se arma con el nombre y la C.I. |
| O47:AH47 | Fecha | **calculado** | — | `=TODAY()` |
| AI47:BE47 | Firma del adulto scout | firma en papel | Sí | — |
| C49:W49 | Vº Bº Jefe de Grupo | firma en papel | Sí | — |

### Historial de formación y reconocimientos (filas 51–96)

| Filas | Sección | Campos | Lista / regla |
|---|---|---|---|
| 52 | Encabezado (calculado) | C.I., nombre, fecha de nacimiento, fecha de promesa | Copiados de arriba |
| 53–61 | Distinciones y condecoraciones (4 filas × 5) | Descripción, fecha | `Distinciones` (30: nudos, barras, órdenes, medallas, Caballo de Plata, Cruz de Alto Mérito, …) |
| 62–77 | **Formación scout** (5 filas × 5 = 25 cursos) | Curso o taller, fecha, **director** | `Capacitacion` (23) |
| 78–96 | Participación en CIP (6 filas × 5 = 30) | Evento, nivel/fecha, **cargo** | `CIP`: Grupal, Distrital, Regional, Nacional |

## Hoja `Acuerdo Mutuo`

| Celda | Etiqueta | Tipo | Origen |
|---|---|---|---|
| D11:W11 / Z11:AG11 / AL11:BF11 | Nombre / C.I. / Cargo o función del adulto | calculado | `Planilla` |
| I12:AD12 / AI12:AQ12 / AV12:BD12 | Correo / tel. hab. / tel. móvil | calculado | `Planilla` |
| I13:AD13 / AI13:BD13 | Nivel de formación aprobado / formación en otros cargos | calculado | `Planilla` (**AI13 apunta a `Planilla!BC39`, una celda interna del rango de «Fecha de ingreso a la unidad actual». Parece un error de fórmula: probablemente debía ser `AX38`, «Otros niveles de formación»**) |
| D15:W15, Z15:AG15, AL15:BD15, I16:AD16, AI16:AQ16, AV16:BD16 | **Asesor personal de formación**: nombre, C.I., cargo, correo, teléfonos | dato | Se escribe a mano |
| D18:W18 … AV19:BD19 | **Supervisor inmediato** (Jefe de Grupo): nombre, C.I., cargo, correo, teléfonos | dato | **Viene prellenado en la plantilla** con los datos de la jefatura actual |
| A21:Y25 | Funciones del cargo (5) + `%` + `v` | calculado + % | `Hoja1` según el cargo |
| AC21:BA36 | Actividades principales (hasta 16) + `%` + `v` | calculado + % | `Hoja1` |
| A27:Y36 | Requerimientos de la instancia + `%` + `v` | calculado + % | `Hoja1` |
| A38 / AC38 | Metas de formación | calculado + % | `Hoja1` |
| A40:Y45 / AC40:BA44 | Apoyo a recibir del nivel supervisor | calculado + % | `Hoja1` |
| A47:BD47 | Declaración conjunta | calculado | Nombres del adulto y del Jefe de Grupo |
| A48:AB49 / AC48:BD49 / AC50:AN50 | Firmas (adulto, Jefe de Grupo) y fecha (`TODAY()`) | firma | — |

Las columnas `%` y `v` parecen ser el **peso** de cada función y una marca de **cumplimiento o seguimiento**. La planilla no lo explica: hay que confirmarlo.

## Hoja `Ficha Médica` (adultos)

Tiene los mismos campos y celdas que la de jóvenes ([01-jovenes.md](01-jovenes.md#campos-de-la-hoja-ficha-médica)), con estas diferencias:
- «HEPATITIS» pasa a ser «**HEPATITIS A**».
- En tratamiento farmacológico dice «**Anexe orden médica**».
- «Cirugías sufridas» se llama «Intervenciones quirúrgicas».
- La declaración la firma el propio adulto (no un representante).
- Las validaciones Sí/No están en celdas sueltas (`H14`, `I23`…) en lugar de rangos combinados. Es solo una diferencia de formato.

## Observaciones sobre la planilla

- **Dirección repetida:** las filas 15 y 16 tienen **dos veces** Estado / Municipio / Parroquia. La fila 15 calcula el código postal; la 16 no. Una planilla llenada de ejemplo usa **solo la fila 16**, así que el código postal queda vacío. Hay que decidir cuál es la buena y quitar la otra.
- El `Acuerdo Mutuo` trae **precargados** el nombre, la C.I., el correo y el teléfono del supervisor actual. Si el formato se comparte, esos datos viajan con él.
- Los catálogos de adelantos no coinciden con los de la planilla de jóvenes («Cachorro(a)», «Novicio(a)», la Comunidad). Hay que unificarlos (tabla `adelantos`).
- `Capacitacion` tiene una errata: «Taller de Conducción de **Cumunidad** de Rovers».

## Esquema SQL propuesto

Reutiliza `personas`, `catalogo`, `adelantos`, `unidades`, `inscripciones`, `fichas_medicas`, `historial_scout_previo`, `distinciones`, `participaciones` y `habilidades` de [01-jovenes.md](01-jovenes.md).

```sql
-- ── Cargos (catálogo de Hoja1) ────────────────────────────
CREATE TABLE cargos (
  id      serial PRIMARY KEY,
  nombre  text NOT NULL UNIQUE          -- Adulto de Programa, Representante de Unidad, Jefe de Grupo, …
);
CREATE TABLE cargo_items (               -- funciones, actividades, requerimientos, metas, apoyo
  id        serial PRIMARY KEY,
  cargo_id  int  NOT NULL REFERENCES cargos(id),
  tipo      text NOT NULL CHECK (tipo IN ('funcion','actividad','requerimiento','meta_formacion','apoyo')),
  orden     int  NOT NULL,
  texto     text NOT NULL
);

-- ── Cursos de formación (catálogo Capacitacion) ───────────
CREATE TABLE cursos (
  id      serial PRIMARY KEY,
  nombre  text NOT NULL UNIQUE,          -- Iniciación, Profundización en Manada, Taller de …
  tipo    text CHECK (tipo IN ('nivel','taller','especializado'))
);

-- ── Adultos ───────────────────────────────────────────────
CREATE TABLE adultos (
  persona_id                 uuid PRIMARY KEY REFERENCES personas(id) ON DELETE CASCADE,
  tel_movil2                 text,
  vehiculo                   jsonb,      -- {"marca":"…","modelo":"…","color":"…","placas":"…"}
  trabajo                    jsonb,      -- {"empresa","cargo","antiguedad","ramo","telefono","direccion"}
  estudia                    boolean,
  estudio                    jsonb,      -- {"donde","carrera","turno"}
  fecha_ingreso_escultismo   date,
  fecha_ingreso_grupo        date,
  fecha_promesa              date,
  fecha_ingreso_adulto       date,
  responsabilidades_previas  text,
  otros_familiares           text,
  organizaciones             text[],
  foto_ref                   text,
  cedula_img_ref             text
);

-- Referencias personales (datos de terceros)
CREATE TABLE adulto_referencias (
  id          serial PRIMARY KEY,
  adulto_id   uuid NOT NULL REFERENCES adultos(persona_id) ON DELETE CASCADE,
  tipo        text NOT NULL CHECK (tipo IN ('familiar','no_familiar','scout')),
  nombre      text NOT NULL,
  parentesco_o_relacion text,           -- parentesco (familiar), relación (no familiar), grupo (scout)
  anios_conocidos numeric(4,1),
  edad        int,
  telefono    text
);

-- Cargo del adulto en una unidad, con historial (reemplaza «Unidad en la que se desempeña / Cargo / Fui adulto scout»)
CREATE TABLE adulto_cargos (
  id          serial PRIMARY KEY,
  adulto_id   uuid NOT NULL REFERENCES adultos(persona_id) ON DELETE CASCADE,
  cargo_id    int  NOT NULL REFERENCES cargos(id),
  unidad_id   int  REFERENCES unidades(id),     -- NULL = a nivel de Grupo
  grupo_externo text,                           -- si fue en otro grupo (historial previo)
  desde       date NOT NULL,
  hasta       date
);

-- Formación recibida
CREATE TABLE adulto_formacion (
  id          serial PRIMARY KEY,
  adulto_id   uuid NOT NULL REFERENCES adultos(persona_id) ON DELETE CASCADE,
  curso_id    int  NOT NULL REFERENCES cursos(id),
  fecha       date,
  director    text,
  es_nivel_cargo boolean NOT NULL DEFAULT false  -- «nivel de formación alcanzado para su cargo»
);

-- Acuerdo mutuo anual
CREATE TABLE acuerdos_mutuos (
  id              serial PRIMARY KEY,
  adulto_id       uuid NOT NULL REFERENCES adultos(persona_id) ON DELETE CASCADE,
  anio            int  NOT NULL,
  cargo_id        int  NOT NULL REFERENCES cargos(id),
  asesor_id       uuid REFERENCES personas(id),   -- asesor personal de formación
  supervisor_id   uuid REFERENCES personas(id),   -- normalmente el Jefe de Grupo
  firmado_en      date,
  UNIQUE (adulto_id, anio)
);
CREATE TABLE acuerdo_items (
  acuerdo_id   int NOT NULL REFERENCES acuerdos_mutuos(id) ON DELETE CASCADE,
  cargo_item_id int NOT NULL REFERENCES cargo_items(id),
  porcentaje   numeric(5,2),
  verificado   boolean,                          -- columna «v»
  PRIMARY KEY (acuerdo_id, cargo_item_id)
);

-- Hijos en el movimiento: no hace falta guardarlo aparte;
-- sale de joven_responsables (01) cuando el adulto es representante de un joven.
```

## Datos sensibles de adultos y cómo protegerlos

Se aplican las mismas reglas de [01-jovenes.md › Datos sensibles](01-jovenes.md#datos-sensibles-de-menores-y-cómo-protegerlos) (cuentas individuales, cifrado por columna, retención y nada de datos reales en el repo), con estos matices:

| Nivel | Datos de adultos | Quién los ve |
|---|---|---|
| Interno | Nombre, cargo, unidad, nivel de formación, formación y CIP | Todos los dirigentes (se necesita para los IP: responsable y staff) |
| Contacto | Teléfonos, correo | Dirigentes. En el **IP** se imprimen teléfono y correo del staff; es parte del formato |
| Personal | Dirección, datos laborales, estudios, vehículo, estado civil, religión, fecha de nacimiento | El propio adulto + Jefatura |
| Sensible | C.I., ficha médica, **referencias (datos de terceros)**, fotos y cédulas, acuerdo mutuo (evaluación) | El propio adulto + Jefatura (el acuerdo mutuo también lo ve el asesor asignado) |

- El adulto debería poder **ver y corregir su propia ficha** (autoservicio): es la forma más simple de mantener los datos al día.
- Las **referencias** son de personas que no firmaron nada: guardar solo lo necesario y borrarlas al terminar el proceso de admisión (o al año).
- Retención: ficha médica anual como en jóvenes; formación, cargos, distinciones y CIP se conservan (historial institucional); los datos de contacto y personales se borran N años después de la baja.
