import { Router } from 'express';
import { checkDbConnection } from '../db/index.js';
import { checkRedisConnection } from '../cache/index.js';

const router = Router();

router.get('/', async (req, res) => {
  const [dbResult, redisResult] = await Promise.all([
    checkDbConnection(),
    checkRedisConnection(),
  ]);

  const isHealthy = dbResult.ok && redisResult.ok;

  const responsePayload = {
    status: isHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    services: {
      postgres: dbResult.ok ? 'connected' : 'disconnected',
      redis: redisResult.ok ? 'connected' : 'disconnected',
    },
  };

  if (!dbResult.ok) {
    responsePayload.services.postgres_error = dbResult.error;
  }

  if (!redisResult.ok) {
    responsePayload.services.redis_error = redisResult.error;
  }

  return res.status(isHealthy ? 200 : 503).json(responsePayload);
});

export default router;
