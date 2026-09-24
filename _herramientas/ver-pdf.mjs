// Renderiza cada página de un PDF a PNG con pdf.js (en Chromium headless) para revisar cortes. Uso: node ver-pdf.mjs <pdf relativo a la raíz> <carpeta salida>
import { chromium } from 'playwright';
const [pdf, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
await p.goto('http://localhost:3472/index.html');
await p.setContent('<body style="margin:0;background:#888"></body>');
const n = await p.evaluate(async (url) => {
  const pdfjs = await import('http://localhost:3472/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'http://localhost:3472/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs';
  const doc = await pdfjs.getDocument(url).promise;
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i), vp = pg.getViewport({ scale: 1.3 });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; c.id = 'pg' + i;
    c.style.cssText = 'display:block;margin:0 0 10px;background:white';
    document.body.appendChild(c);
    await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  }
  return doc.numPages;
}, 'http://localhost:3472/' + pdf);
for (let i = 1; i <= n; i++) await p.locator('#pg' + i).screenshot({ path: `${out}/${pdf.split('/').pop().replace('.pdf', '')}-p${i}.png` });
console.log(pdf, n, 'páginas'); await b.close();
