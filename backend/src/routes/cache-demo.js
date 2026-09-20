import { Router } from 'express';
import { redis } from '../cache/index.js';

const router = Router();

const FAKE_DB = {
  'user:42': { id: 42, nombre: 'Ada Lovelace', rol: 'admin', email: 'ada@runlearn.dev' },
  'curso:7': { id: 7, titulo: 'Programación Web Dinámica', progreso: 68, total_clases: 12 },
  'config:app': { theme: 'dark', lang: 'es', max_upload_mb: 10 },
  'stats:visitas': { hoy: 1340, semana: 8920, mes: 34100 },
};

const TTL_SECONDS = 15;
const SIMULATED_DB_DELAY = 800;

function simulateSlowDbQuery(key) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const value = FAKE_DB[key] || { key, message: 'Dato generado dinámicamente', ts: Date.now() };
      resolve(value);
    }, SIMULATED_DB_DELAY);
  });
}

router.get('/:key', async (req, res) => {
  const { key } = req.params;
  const start = performance.now();

  try {
    const cached = await redis.get(`cache-demo:${key}`);
    const redisTime = performance.now() - start;

    if (cached) {
      return res.json({
        hit: true,
        key,
        data: JSON.parse(cached),
        timing: {
          redis_ms: Number(redisTime.toFixed(2)),
          total_ms: Number((performance.now() - start).toFixed(2)),
        },
        ttl_seconds: await redis.ttl(`cache-demo:${key}`),
      });
    }

    const dbStart = performance.now();
    const data = await simulateSlowDbQuery(key);
    const dbTime = performance.now() - dbStart;

    await redis.setex(`cache-demo:${key}`, TTL_SECONDS, JSON.stringify(data));
    const totalTime = performance.now() - start;

    return res.json({
      hit: false,
      key,
      data,
      timing: {
        redis_ms: Number(redisTime.toFixed(2)),
        postgres_ms: Number(dbTime.toFixed(2)),
        total_ms: Number(totalTime.toFixed(2)),
      },
      ttl_seconds: TTL_SECONDS,
    });
  } catch (error) {
    const totalTime = performance.now() - start;
    return res.status(500).json({
      error: 'Error en cache-demo',
      message: error.message,
      timing: { total_ms: Number(totalTime.toFixed(2)) },
    });
  }
});

export default router;
