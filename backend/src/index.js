// dotenv debe cargarse antes de evaluar cualquier módulo que lea process.env.
import 'dotenv/config';
import app from './app.js';
import { runMigrations } from './db/migrate.js';
import { pool } from './db/index.js';
import { redis } from './cache/index.js';

// Render asigna el puerto dinámicamente; local/docker usa 5000.
const PORT = parseInt(process.env.PORT || '5000', 10);

let server;
let isShuttingDown = false;

async function startServer() {
  try {
    await runMigrations();
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[RunLearn Backend] Servidor iniciado en http://0.0.0.0:${PORT}`);
      console.log(`[Health check] http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[RunLearn Backend] No se pudo completar el arranque:', error.message);
    await Promise.allSettled([pool.end(), redis.quit()]);
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[RunLearn Backend] ${signal}: cerrando conexiones...`);

  const forceExitTimer = setTimeout(() => process.exit(1), 10000);
  forceExitTimer.unref();

  const closeHttpServer = server
    ? new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    : Promise.resolve();

  const closeRedis = redis.status === 'end' ? Promise.resolve() : redis.quit();
  const results = await Promise.allSettled([closeHttpServer, pool.end(), closeRedis]);
  clearTimeout(forceExitTimer);
  const shutdownError = results.find((result) => result.status === 'rejected');
  if (shutdownError) {
    console.error('[RunLearn Backend] Error al cerrar conexiones:', shutdownError.reason);
    process.exitCode = 1;
  }
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

await startServer();
