/* ╔══════════════════════════════════════════════════════════╗
   ║  ⚙️ CONFIGURACIÓN DEL SITIO                                ║
   ╚══════════════════════════════════════════════════════════╝
   nube: false → versión solo GitHub Pages (sin backend).
         Oculta los botones "☁️ Guardar" y la página Programas no
         consulta ninguna API. El backend (Vercel + Neon) está
         guardado en _futuro/nube-neon/ para la Versión 2.
   Para reactivarla: ver _futuro/nube-neon/LEEME.md y poner nube: true. */
window.SCOUT_CONFIG = Object.assign({ nube: false }, window.SCOUT_CONFIG || {});
