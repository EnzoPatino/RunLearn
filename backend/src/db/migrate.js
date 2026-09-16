import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../db/migrations');

export async function runMigrations() {
  if (!fs.existsSync(migrationsDir)) {
    console.log('[Migraciones] Directorio de migraciones no encontrado:', migrationsDir);
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  console.log(`[Migraciones] Encontradas ${files.length} migraciones.`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`[Migraciones] Ejecutando: ${file}...`);
    await pool.query(sql);
    console.log(`[Migraciones] OK: ${file}`);
  }

  console.log('[Migraciones] Todas las migraciones fueron ejecutadas con éxito.');
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migraciones] Error al ejecutar migraciones:', err);
      process.exit(1);
    });
}
