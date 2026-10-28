import { Router } from 'express';

const router = Router();

// Configuración del algoritmo Token Bucket para la demo
const CAPACITY = 5; // Capacidad máxima del balde (tokens)
const REFILL_INTERVAL_MS = 2500; // Se repone 1 token cada 2.5 segundos
const BUCKET_TTL_MS = 15 * 60 * 1000; // Limpieza tras 15 minutos de inactividad

// Memoria de baldes por cliente
const buckets = new Map();

function getOrCreateBucket(clientId) {
  const now = Date.now();
  pruneInactiveBuckets();

  let bucket = buckets.get(clientId);
  if (!bucket) {
    bucket = {
      tokens: CAPACITY,
      lastRefill: now,
      createdAt: now,
    };
    buckets.set(clientId, bucket);
  } else {
    // Calcular recarga según tiempo transcurrido
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / REFILL_INTERVAL_MS);
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(CAPACITY, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now - (elapsed % REFILL_INTERVAL_MS);
    }
  }

  return bucket;
}

function pruneInactiveBuckets() {
  const now = Date.now();
  for (const [id, bucket] of buckets) {
    if (now - bucket.lastRefill > BUCKET_TTL_MS) {
      buckets.delete(id);
    }
  }
}

// POST /request - Simula una petición que consume un token
router.post('/request', (req, res) => {
  const clientId = String(req.body?.clientId || req.ip || 'anonymous').trim();
  const bucket = getOrCreateBucket(clientId);
  const now = Date.now();

  const timeUntilNextToken = Math.max(0, REFILL_INTERVAL_MS - (now - bucket.lastRefill));
  const retryAfterSeconds = Math.max(1, Math.ceil(timeUntilNextToken / 1000));

  res.set('X-RateLimit-Limit', String(CAPACITY));
  res.set('X-RateLimit-Remaining', String(Math.max(0, bucket.tokens - (bucket.tokens >= 1 ? 1 : 0))));
  res.set('X-RateLimit-Reset', String(retryAfterSeconds));

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return res.status(200).json({
      success: true,
      status: 200,
      allowed: true,
      remaining: bucket.tokens,
      capacity: CAPACITY,
      refillIntervalMs: REFILL_INTERVAL_MS,
      retryAfter: 0,
      algorithm: 'Token Bucket',
      message: 'Petición aceptada: consumió 1 token del balde.',
      timestamp: new Date().toISOString(),
    });
  }

  // Balde vacío -> 429 Too Many Requests
  res.set('Retry-After', String(retryAfterSeconds));
  return res.status(429).json({
    success: false,
    status: 429,
    allowed: false,
    remaining: 0,
    capacity: CAPACITY,
    refillIntervalMs: REFILL_INTERVAL_MS,
    retryAfter: retryAfterSeconds,
    algorithm: 'Token Bucket',
    message: '429 Too Many Requests: Balde agotado. La petición fue bloqueada.',
    timestamp: new Date().toISOString(),
  });
});

// GET /status - Consulta estado actual del balde sin consumir tokens
router.get('/status', (req, res) => {
  const clientId = String(req.query.clientId || req.ip || 'anonymous').trim();
  const bucket = getOrCreateBucket(clientId);
  const now = Date.now();

  const timeUntilNextToken = Math.max(0, REFILL_INTERVAL_MS - (now - bucket.lastRefill));
  const retryAfterSeconds = Math.max(1, Math.ceil(timeUntilNextToken / 1000));

  res.set('X-RateLimit-Limit', String(CAPACITY));
  res.set('X-RateLimit-Remaining', String(bucket.tokens));

  return res.json({
    tokens: bucket.tokens,
    capacity: CAPACITY,
    refillIntervalMs: REFILL_INTERVAL_MS,
    timeUntilNextToken,
    retryAfterSeconds,
  });
});

// POST /reset - Restaura el balde a su capacidad máxima
router.post('/reset', (req, res) => {
  const clientId = String(req.body?.clientId || req.ip || 'anonymous').trim();
  buckets.set(clientId, {
    tokens: CAPACITY,
    lastRefill: Date.now(),
    createdAt: Date.now(),
  });

  return res.json({
    message: 'Balde reseteado exitosamente a su capacidad máxima.',
    tokens: CAPACITY,
    capacity: CAPACITY,
  });
});

export default router;
