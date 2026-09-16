import dotenv from 'dotenv';
import app from './app.js';
import { runMigrations } from './db/migrate.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);

runMigrations().catch((err) => {
  console.warn('[RunLearn Backend] Aviso al ejecutar migraciones automáticas:', err.message);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[RunLearn Backend] Servidor iniciado en http://0.0.0.0:${PORT}`);
  console.log(`[Health check] http://localhost:${PORT}/api/health`);
});
