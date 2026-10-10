import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../db/migrations');

// Códigos PostgreSQL para "ya existe" (tabla/índice/relación duplicada).
const ALREADY_EXISTS_CODES = new Set(['42P07', '42710', '42P16']);

function isAlreadyExistsError(err) {
  if (!err) return false;
  if (ALREADY_EXISTS_CODES.has(err.code)) return true;
  return typeof err.message === 'string' && /already exists/i.test(err.message);
}

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
    try {
      await pool.query(sql);
      console.log(`[Migraciones] OK: ${file}`);
    } catch (err) {
      // Todas las migraciones son idempotentes (IF NOT EXISTS / ON CONFLICT),
      // pero se tolera el error de duplicado por si las tablas ya existen
      // (Supabase previo, corrida anterior o initdb de docker-compose).
      if (isAlreadyExistsError(err)) {
        console.warn(`[Migraciones] Ya existía, se omite: ${file} (${err.code || 'duplicate'})`);
        continue;
      }
      throw err;
    }
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
