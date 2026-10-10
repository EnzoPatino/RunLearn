// dotenv debe cargarse antes de evaluar cualquier módulo que lea process.env.
import 'dotenv/config';
import app from './app.js';
import { runMigrations } from './db/migrate.js';

// Render asigna el puerto dinámicamente; local/docker usa 5000.
const PORT = parseInt(process.env.PORT || '5000', 10);

runMigrations().catch((err) => {
  console.warn('[RunLearn Backend] Aviso al ejecutar migraciones automáticas:', err.message);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[RunLearn Backend] Servidor iniciado en http://0.0.0.0:${PORT}`);
  console.log(`[Health check] http://localhost:${PORT}/api/health`);
});
