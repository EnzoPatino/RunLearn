import { Router } from 'express';
import { checkDbConnection } from '../db/index.js';
import { checkRedisConnection } from '../cache/index.js';
import { getTotalRequests, formatUptime } from '../metrics.js';

const router = Router();

router.get('/', async (req, res) => {
  const [dbResult, redisResult] = await Promise.all([
    checkDbConnection(),
    checkRedisConnection(),
  ]);

  const uptimeSeconds = Math.floor(process.uptime());
  const mem = process.memoryUsage();

  const responsePayload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    requestsCount: getTotalRequests(),
    services: {
      postgres: dbResult.ok ? 'connected' : 'disconnected',
      redis: redisResult.ok ? 'connected' : 'disconnected',
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memoryRssMb: +(mem.rss / (1024 * 1024)).toFixed(2),
      heapUsedMb: +(mem.heapUsed / (1024 * 1024)).toFixed(2),
    },
  };

  if (!dbResult.ok && dbResult.error) {
    responsePayload.services.postgres_error = dbResult.error;
  }
  if (!redisResult.ok && redisResult.error) {
    responsePayload.services.redis_error = redisResult.error;
  }

  return res.status(200).json(responsePayload);
});

export default router;
