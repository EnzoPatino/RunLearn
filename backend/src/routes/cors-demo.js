import { Router } from 'express';

const router = Router();

// Lista blanca: los orígenes que pertenecen al propio portal.
// En producción se amplía con la env CORS_PORTAL_ORIGINS (separada por comas).
const PORTAL_ORIGINS = (
  process.env.CORS_PORTAL_ORIGINS ||
  'http://localhost:4321,http://127.0.0.1:4321,http://localhost:4173,https://runlearn.vercel.app'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// GET /api/cors-demo?mode=restrictivo|abierto[&origin=<origen simulado>]
router.get('/', (req, res) => {
  // app.js aplica cors() global (Access-Control-Allow-Origin: *).
  // Esta demo necesita controlar ese header a mano, así que lo limpiamos.
  res.removeHeader('Access-Control-Allow-Origin');

  const mode = req.query.mode === 'abierto' ? 'abierto' : 'restrictivo';

  // `?origin=` existe SOLO para que la pestaña simulada pueda "declarar" un
  // origen distinto al real. En un navegador el header Origin lo escribe el
  // navegador: el sitio no puede modificarlo ni inventarlo.
  const claimedOrigin =
    typeof req.query.origin === 'string' && req.query.origin ? req.query.origin : req.get('origin');

  let acao = null;

  if (mode === 'abierto') {
    // API pública: cualquiera puede leer la respuesta.
    acao = '*';
  } else if (claimedOrigin && PORTAL_ORIGINS.includes(claimedOrigin)) {
    // API privada / restrictiva: sólo el dominio del portal.
    // Se devuelve exactamente el origen pedido (nunca '*').
    acao = claimedOrigin;
    res.set('Vary', 'Origin');
  }

  if (acao) {
    res.set('Access-Control-Allow-Origin', acao);
  }
  // Restringido + origen ajeno: la respuesta SÍ sale (200 + JSON) pero SIN
  // Access-Control-Allow-Origin. El navegador la recibe por la red e impide
  // que el JavaScript del sitio la lea → error de CORS en consola.

  res.json({
    ok: true,
    message: 'Hola desde la API de RunLearn',
    mode,
    origin: claimedOrigin || null,
    acao,
    allowed: acao !== null,
    timestamp: new Date().toISOString(),
  });
});

export default router;
