#!/usr/bin/env python3
"""Erratas de I.L. (paso P9, docs/00-PLAN.md).

Lee la tabla «Erratas del Excel y versión corregida» de docs/indicadores-de-logro.md y:
  1. reemplaza cada texto literal del Excel por su versión corregida en INDICADORES (js/datos-il.js), por texto exacto
     y solo en la rama/área/etapa que indica su código;
  2. actualiza los _ind de programas/**/*.json que usen un texto viejo;
  3. escribe en js/datos-il.js el mapa IL_ERRATAS (viejo → nuevo) que usa la importación de JSON.
El Excel no se toca.

Uso (desde la raíz):
  python3 _herramientas/erratas_il.py              # aplica y reporta
  python3 _herramientas/erratas_il.py --verificar  # compara; sale con 0 diferencias si todo está aplicado
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DOC = RAIZ / 'docs' / 'indicadores-de-logro.md'
DATOS = RAIZ / 'js' / 'datos-il.js'
RAMAS = {'M': 'manada', 'T': 'tropa', 'C': 'clan'}
AREAS = {'COR': 'Corporalidad', 'CRE': 'Creatividad', 'CAR': 'Carácter', 'AFE': 'Afectividad', 'SOC': 'Sociabilidad', 'ESP': 'Espiritualidad'}
INI_MAPA, FIN_MAPA = '// ─── IL_ERRATAS (generado por _herramientas/erratas_il.py; no editar a mano) ───', '// ─── fin IL_ERRATAS ───'


def erratas():
    txt = DOC.read_text(encoding='utf-8')
    bloque = txt[txt.index('## Erratas del Excel y versión corregida'):]
    bloque = bloque[:bloque.index('\n## ', 5)]
    filas = []
    for linea in bloque.splitlines():
        m = re.match(r'\|\s*([MTC])-([A-Z]{3})-(E\d)-\d+\s*\|[^|]*\|[^|]*\|\s*(.+?)\s*\|\s*\*\*(.+?)\*\*\s*\|', linea)
        if m:
            r, a, e, viejo, nuevo = m.groups()
            filas.append({'codigo': linea.split('|')[1].strip(), 'rama': RAMAS[r], 'area': AREAS[a], 'etapa': e, 'viejo': viejo, 'nuevo': nuevo})
    return filas


def leer_indicadores(src):
    i = src.index('let INDICADORES = ') + len('let INDICADORES = ')
    j = src.index('\n', i)
    return json.loads(src[i:j].rstrip().rstrip(';'))


def mapa_js(filas):
    cuerpo = ',\n'.join(f'  {json.dumps(f["viejo"], ensure_ascii=False)}: {json.dumps(f["nuevo"], ensure_ascii=False)}' for f in filas)
    return f'{INI_MAPA}\n// Textos literales del Excel → versión corregida (docs/indicadores-de-logro.md). La importación de JSON los traduce.\nconst IL_ERRATAS = {{\n{cuerpo}\n}};\n{FIN_MAPA}'


def programas():
    return sorted(p for p in (RAIZ / 'programas').rglob('*.json') if p.name != 'index.json' and not any(x.startswith('.') for x in p.relative_to(RAIZ / 'programas').parts))


def aplicar(filas):
    src = DATOS.read_text(encoding='utf-8')
    ind = leer_indicadores(src)
    for f in filas:
        lista = ind.get(f['rama'], {}).get(f['area'], {}).get(f['etapa'], [])
        if f['nuevo'] in lista and f['viejo'] not in lista:
            print(f"  = {f['codigo']}: ya corregido"); continue
        if f['viejo'] not in lista:
            print(f"  ✗ {f['codigo']}: el texto del Excel no está en {f['rama']} / {f['area']} / {f['etapa']}"); return False
        viejo_q = json.dumps(f['viejo'], ensure_ascii=False)
        if src.count(viejo_q) != 1:
            print(f"  ✗ {f['codigo']}: el texto aparece {src.count(viejo_q)} veces en js/datos-il.js (se esperaba 1)"); return False
        src = src.replace(viejo_q, json.dumps(f['nuevo'], ensure_ascii=False))
        print(f"  ✓ {f['codigo']}: {f['viejo'][:50]}… → corregido")
    bloque = mapa_js(filas)
    if INI_MAPA in src:
        src = src[:src.index(INI_MAPA)] + bloque + src[src.index(FIN_MAPA) + len(FIN_MAPA):]
    else:
        src = src.rstrip('\n') + '\n\n' + bloque + '\n'
    DATOS.write_text(src, encoding='utf-8')
    # programas del repo
    mapa = {f['viejo']: f['nuevo'] for f in filas}
    # Reemplazo de texto exacto (no json.dumps) para no reformatear el resto del archivo
    for p in programas():
        txt = p.read_text(encoding='utf-8')
        usados = [r.get('texto') for r in json.loads(txt).get('_ind', []) if r.get('texto') in mapa]
        n = 0
        for viejo in set(usados):
            patron = re.compile(r'("texto"\s*:\s*)' + re.escape(json.dumps(viejo, ensure_ascii=False)))
            txt, k = patron.subn(lambda m: m.group(1) + json.dumps(mapa[viejo], ensure_ascii=False), txt)
            n += k
        if n:
            json.loads(txt)
            p.write_text(txt, encoding='utf-8')
            print(f'  ✓ {p.relative_to(RAIZ)}: {n} I.L. actualizados')
    return True


def verificar(filas):
    src = DATOS.read_text(encoding='utf-8')
    ind = leer_indicadores(src)
    difs = 0
    for f in filas:
        lista = ind.get(f['rama'], {}).get(f['area'], {}).get(f['etapa'], [])
        if f['nuevo'] not in lista or f['viejo'] in lista:
            print(f"  ✗ {f['codigo']}: no coincide con la versión corregida"); difs += 1
    viejos = {f['viejo'] for f in filas}
    for p in programas():
        for r in json.loads(p.read_text(encoding='utf-8')).get('_ind', []):
            if r.get('texto') in viejos:
                print(f"  ✗ {p.relative_to(RAIZ)}: usa un texto viejo: {r['texto'][:50]}"); difs += 1
    if INI_MAPA not in src:
        print('  ✗ falta el mapa IL_ERRATAS en js/datos-il.js'); difs += 1
    totales = {r: sum(len(l) for a in ind[r].values() for l in a.values()) for r in ('manada', 'tropa', 'clan')}
    print(f"{'✓' if not difs else '✗'} {len(filas)} erratas · {difs} diferencias · I.L. por rama: {totales}")
    return difs == 0


if __name__ == '__main__':
    filas = erratas()
    if len(filas) != 17:
        print(f'✗ Se esperaban 17 erratas en la tabla y se leyeron {len(filas)}'); sys.exit(1)
    sys.exit(0 if (verificar(filas) if '--verificar' in sys.argv else aplicar(filas) and verificar(filas)) else 1)
