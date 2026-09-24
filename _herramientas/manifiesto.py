#!/usr/bin/env python3
"""Manifiesto de programas del repo (paso P8, docs/00-PLAN.md).

GitHub Pages no lista carpetas, así que programas.html lee programas/index.json.

Uso (desde la raíz del proyecto):
  python3 _herramientas/manifiesto.py              # (re)genera programas/index.json
  python3 _herramientas/manifiesto.py --verificar  # solo valida: rutas existen, son JSON de ficha y no falta ninguno

Correr después de agregar, mover o borrar un JSON en programas/.
"""
import html
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / 'programas'
MANIFIESTO = CARPETA / 'index.json'
RAMAS = {'manada', 'tropa', 'comunidad', 'clan', 'grupal'}


def texto(v):
    return html.unescape(re.sub(r'<[^>]+>', ' ', v or '')).strip()


def entrada(ruta):
    d = json.loads(ruta.read_text(encoding='utf-8'))
    datos = d.get('_data') or {}
    if not isinstance(datos, dict) or '_prog' not in d:
        raise ValueError('no parece un JSON de la Ficha (faltan _data/_prog)')
    rama = (d.get('_rama') or texto(datos.get('unidad'))).lower()
    return {
        'titulo': re.sub(r'\s+', ' ', texto(datos.get('nombre-act'))) or ruta.stem,
        'rama': rama if rama in RAMAS else '',
        'fecha': d.get('_fechaIni') or '',
        'fechaFin': d.get('_fechaFin') or '',
        'momentos': len([m for m in d.get('_prog', []) if m.get('type') != 'day-sep']),
        'ruta': ruta.relative_to(RAIZ).as_posix(),
    }


def jsons():
    # Sin carpetas ocultas (ej. programas/.claude/, configuración local ignorada por git)
    return sorted(p for p in CARPETA.rglob('*.json') if p != MANIFIESTO and not any(x.startswith('.') for x in p.relative_to(CARPETA).parts))


def generar():
    lista, errores = [], []
    for p in jsons():
        try:
            lista.append(entrada(p))
        except Exception as e:  # un JSON roto no debe impedir generar el resto
            errores.append(f'{p.relative_to(RAIZ)}: {e}')
    lista.sort(key=lambda x: (x['fecha'], x['ruta']), reverse=True)
    MANIFIESTO.write_text(json.dumps({'version': 1, 'programas': lista}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'programas/index.json: {len(lista)} programas')
    for e in errores:
        print('  ⚠', e)
    return not errores


def verificar():
    try:
        m = json.loads(MANIFIESTO.read_text(encoding='utf-8'))
    except FileNotFoundError:
        print('✗ No existe programas/index.json (corre este script sin --verificar)')
        return False
    ok = True
    listadas = set()
    for e in m.get('programas', []):
        ruta = RAIZ / e['ruta']
        listadas.add(ruta)
        if not ruta.exists():
            print(f"✗ {e['ruta']}: no existe"); ok = False; continue
        try:
            entrada(ruta)
        except Exception as ex:
            print(f"✗ {e['ruta']}: {ex}"); ok = False
    for p in jsons():
        if p not in listadas:
            print(f'✗ {p.relative_to(RAIZ)}: existe pero no está en el manifiesto'); ok = False
    print(('✓' if ok else '✗') + f" manifiesto: {len(m.get('programas', []))} rutas")
    return ok


if __name__ == '__main__':
    sys.exit(0 if (verificar() if '--verificar' in sys.argv else generar()) else 1)
