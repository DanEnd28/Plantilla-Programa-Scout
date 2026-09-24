// Auditoría de accesibilidad con axe-core (paso P10, docs/00-PLAN.md). Uso (servidor en :3472): node _herramientas/accesibilidad.mjs
// Revisa la Ficha (vacía, con programa, modal I.L. abierto, panel derecho) y Programas. Reglas WCAG 2.1 A/AA.
import { chromium } from 'playwright';
import fs from 'fs';
const AXE = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const B = 'http://localhost:3472/';
const b = await chromium.launch();
const casos = [
  ['asistente de inicio', async p => { await p.waitForTimeout(300); }],
  ['ficha vacía', async p => { await p.evaluate(() => asSaltar()); }],
  ['ficha con programa', async p => { await p.setInputFiles('input[type=file][accept=".json"] >> nth=0', 'programas/2026-05-17.json'); await p.waitForTimeout(800); }],
  ['modal I.L.', async p => { await p.evaluate(() => openM('mInd')); await p.waitForTimeout(300); }],
  ['panel Configuración', async p => { await p.evaluate(() => openConfigPanel()); await p.waitForTimeout(300); }],
  ['panel Programa', async p => { await p.setInputFiles('input[type=file][accept=".json"] >> nth=0', 'programas/2026-05-17.json'); await p.waitForTimeout(800); await p.evaluate(() => openProgramaPanel()); await p.waitForTimeout(300); }],
  ['panel Secciones', async p => { await p.evaluate(() => openIndicePanel()); await p.waitForTimeout(300); }],
];
const resumen = {};
async function auditar(nombre, url, prep, viewport = { width: 1440, height: 900 }) {
  const p = await (await b.newContext({ viewport })).newPage();
  await p.goto(B + url); await p.waitForTimeout(600);
  await prep(p);
  await p.addScriptTag({ content: AXE });
  const r = await p.evaluate(async (todo) => {
    // Solo lo que está a la vista: la ficha en sí (hoja impresa) queda fuera de la regla de contraste de su diseño oficial
    const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return res.violations.map(v => ({ id: v.id, impacto: v.impact, n: v.nodes.length, ej: v.nodes.slice(0, todo ? 99 : 3).map(x => x.target.join(' ') + ' → ' + (x.failureSummary || '').split('\n')[1]?.trim()) }));
  }, process.argv.includes('--todo'));
  resumen[nombre] = r;
  await p.close();
}
for (const [n, prep] of casos) await auditar(n, 'index.html', prep);
await auditar('ficha móvil', 'index.html', async () => {}, { width: 360, height: 740 });
await auditar('programas', 'programas.html', async p => { await p.waitForTimeout(400); });
await auditar('ayuda', 'ayuda.html', async () => {});
await auditar('programas calendario', 'programas.html', async p => { await p.click('.b-vista button[data-vista="calendario"]'); await p.waitForTimeout(300); });
for (const [n, vs] of Object.entries(resumen)) {
  console.log(`\n■ ${n}: ${vs.length ? vs.map(v => v.id + '×' + v.n).join(', ') : '0 problemas'}`);
  if (process.argv.includes('--detalle')) vs.forEach(v => { console.log(`  · ${v.id} (${v.impacto}, ${v.n})`); v.ej.forEach(e => console.log('      ' + e)); });
}
await b.close();
