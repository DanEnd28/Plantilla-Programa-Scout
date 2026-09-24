// Servidor local mínimo para probar sin Vercel CLI (alternativa a `vercel dev`).
// Sirve los archivos estáticos y monta las funciones de /api con las mismas
// reescrituras de vercel.json. Uso: npm run dev:local  → http://localhost:3000
import './_env.mjs';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { RAIZ } from './_env.mjs';

const PUERTO = Number(process.env.PORT || 3000);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8',
};

const programas = await import('../api/programas.js');
const salud = await import('../api/salud.js');

function reescribir(pathname) {
  let m = pathname.match(/^\/api\/programas\/([^/]+)\/versiones\/(\d+)\/?$/);
  if (m) return { mod: programas, query: { id: m[1], vista: 'versiones', n: m[2] } };
  m = pathname.match(/^\/api\/programas\/([^/]+)\/versiones\/?$/);
  if (m) return { mod: programas, query: { id: m[1], vista: 'versiones' } };
  m = pathname.match(/^\/api\/programas\/([^/]+)\/?$/);
  if (m) return { mod: programas, query: { id: m[1] } };
  if (/^\/api\/programas\/?$/.test(pathname)) return { mod: programas, query: {} };
  if (/^\/api\/salud\/?$/.test(pathname)) return { mod: salud, query: {} };
  return null;
}

async function leerCuerpo(req) {
  const partes = [];
  for await (const c of req) partes.push(c);
  return Buffer.concat(partes);
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    const r = reescribir(url.pathname);
    if (r) {
      for (const [k, v] of Object.entries(r.query)) url.searchParams.set(k, v);
      const handler = r.mod[req.method];
      if (!handler) { res.writeHead(405, { 'content-type': 'application/json' }); return res.end('{"ok":false,"error":"metodo_no_permitido"}'); }
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
      if (!headers.has('x-forwarded-for')) headers.set('x-forwarded-for', req.socket.remoteAddress || '');
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await leerCuerpo(req);
      const resp = await handler(new Request(url, { method: req.method, headers, body }));
      res.writeHead(resp.status, Object.fromEntries(resp.headers));
      return res.end(Buffer.from(await resp.arrayBuffer()));
    }
    // Estáticos
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const archivo = path.join(RAIZ, path.normalize(rel));
    if (!archivo.startsWith(RAIZ) || /\/(\.env|\.git|node_modules|api|scripts|db)(\/|$)/.test(archivo.slice(RAIZ.length))) { res.writeHead(403); return res.end(); }
    const s = await stat(archivo).catch(() => null);
    if (!s || !s.isFile()) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream' });
    res.end(await readFile(archivo));
  } catch (e) {
    console.error(e);
    res.writeHead(500); res.end('Error');
  }
});

servidor.listen(PUERTO, () => {
  console.log(`🏕️  Servidor local en http://localhost:${PUERTO}`);
  const si = k => (process.env[k] ? 'sí' : 'no');
  console.log(`   Base de datos: ${process.env.DATABASE_URL ? 'configurada' : '⚠️ falta DATABASE_URL'}  ·  EDIT_KEY: ${si('EDIT_KEY')}  ·  READ_KEY: ${si('READ_KEY')}  ·  ADMIN_KEY: ${si('ADMIN_KEY')}`);
});
