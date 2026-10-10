import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const baseOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
};

const redisUrl = process.env.REDIS_URL?.trim();

// Producción (Render + Upstash): REDIS_URL, típicamente rediss:// (TLS).
// ioredis habilita TLS automáticamente cuando el esquema es rediss://.
// Desarrollo local (docker-compose): REDIS_HOST / REDIS_PORT.
export const redis = redisUrl
  ? new Redis(redisUrl, baseOptions)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      ...baseOptions,
    });

redis.on('error', (err) => {
  console.warn('[Redis] Advertencia de conexión:', err.message);
});

export async function checkRedisConnection() {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      await redis.connect().catch(() => {});
    }
    const pong = await redis.ping();
    return { ok: pong === 'PONG' };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export default {
  redis,
  checkRedisConnection,
};
