// Verificación headless de la Ficha Scout.
// Uso (desde la raíz del proyecto):
//   python3 -m http.server 3472 &        # servir el sitio
//   node _herramientas/verificar.mjs /tmp/verif-salida
// Requiere playwright (npm i -D playwright && npx playwright install chromium).
// En WSL, si falta libnspr4: exportar LD_LIBRARY_PATH con las librerías (ver CLAUDE.md).
import { chromium } from 'playwright';
import fs from 'fs';
import crypto from 'crypto';
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const B = 'http://localhost:3472/';
import path from 'path';
const PROG = path.resolve('programas/2026-05-17.json');
const b = await chromium.launch();
const res = { errores: {} };
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16);
function vigilar(p, nombre) {
  const errs = (res.errores[nombre] = []);
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  p.on('requestfailed', r => errs.push('failed ' + r.url()));
}
async function contarIL(p) {
  const il = {};
  for (const rama of ['manada', 'tropa', 'clan', 'comunidad']) {
    await p.evaluate(() => openM('mInd'));
    await p.selectOption('#ind-rama', rama); await p.waitForTimeout(100);
    il[rama] = await p.$$eval('#ind-panel input[type=checkbox]', it => it.length);
    await p.evaluate(() => closeM('mInd'));
  }
  return il;
}
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage(); vigilar(p, 'index');
await p.goto(B + 'index.html'); await p.waitForTimeout(800);
res.il = await contarIL(p);
await p.screenshot({ path: `${OUT}/01-vacia-desktop.png`, fullPage: true });
// importar un programa real
await p.setInputFiles('input[type=file][accept=".json"] >> nth=0', PROG);
await p.waitForTimeout(800);
res.trasImportar = await p.evaluate(() => ({ nombre: document.getElementById('hdr-nombre-act')?.textContent.trim(), prog: document.querySelectorAll('#prog-tbody tr').length, ind: document.querySelectorAll('#ind-tbody tr').length, ods: odsActivos.size, rama: ramaActual }));
await p.screenshot({ path: `${OUT}/02-programa-desktop.png`, fullPage: true });
// agregar I.L.: 2 de Manada
await p.evaluate(() => openM('mInd')); await p.selectOption('#ind-rama', 'manada'); await p.waitForTimeout(100);
await p.click('#ind-panel .ind-grp-title >> nth=0'); const cks = await p.$$('#ind-panel .ind-item'); await cks[0].click(); await cks[5].click();
await p.click('button[onclick="applyInd()"]'); await p.waitForTimeout(200);
res.trasAgregarIL = await p.$$eval('#ind-tbody tr', t => t.length);
// persistencia
await p.reload(); await p.waitForTimeout(800);
res.trasRecargar = await p.evaluate(() => ({ nombre: document.getElementById('hdr-nombre-act')?.textContent.trim(), prog: document.querySelectorAll('#prog-tbody tr').length, ind: document.querySelectorAll('#ind-tbody tr').length, ods: odsActivos.size }));
// exportar JSON
let [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => doExportJSON())]);
await dl.saveAs(`${OUT}/export.json`); res.exportNombre = dl.suggestedFilename(); res.exportHash = hash(`${OUT}/export.json`);
// guardar HTML (en la línea base ya falla: se registra el error)
// impresión
await p.emulateMedia({ media: 'print' });
await p.screenshot({ path: `${OUT}/03-print.png`, fullPage: true });
await p.emulateMedia({ media: 'screen' });
await p.pdf({ path: `${OUT}/ficha.pdf`, format: 'A4', printBackground: true });
res.pdfPaginas = (fs.readFileSync(`${OUT}/ficha.pdf`, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
// importar en contexto limpio
const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p2 = await ctx2.newPage(); vigilar(p2, 'index-import');
await p2.goto(B + 'index.html'); await p2.waitForTimeout(600);
await p2.setInputFiles('input[type=file][accept=".json"] >> nth=0', `${OUT}/export.json`); await p2.waitForTimeout(800);
res.trasImportarExport = await p2.evaluate(() => ({ nombre: document.getElementById('hdr-nombre-act')?.textContent.trim(), prog: document.querySelectorAll('#prog-tbody tr').length, ind: document.querySelectorAll('#ind-tbody tr').length, ods: odsActivos.size }));
await p2.screenshot({ path: `${OUT}/04-reimportado-desktop.png`, fullPage: true });
// móvil
const m = await b.newPage({ viewport: { width: 375, height: 800 } }); vigilar(m, 'movil');
await m.goto(B + 'index.html'); await m.waitForTimeout(600);
await m.screenshot({ path: `${OUT}/05-movil.png`, fullPage: true });
await m.evaluate(() => toggleBottomSheet()); await m.waitForTimeout(300);
await m.screenshot({ path: `${OUT}/06-movil-drawer.png` });
// otras páginas
for (const pg of ['programas.html', 'promesa-ley-manada.html']) {
  const q = await b.newPage({ viewport: { width: 1440, height: 900 } }); vigilar(q, pg);
  await q.goto(B + pg); await q.waitForTimeout(600);
  await q.screenshot({ path: `${OUT}/07-${pg}.png`, fullPage: true });
  await q.close();
}
res.capturas = Object.fromEntries(fs.readdirSync(OUT).filter(f => f.endsWith('.png')).map(f => [f, hash(`${OUT}/${f}`)]));
fs.writeFileSync(`${OUT}/resultado.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await b.close();
