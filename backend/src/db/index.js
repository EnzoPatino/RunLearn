import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Producción (Render + Supabase): DATABASE_URL es un connection string completo.
// Desarrollo local (docker-compose): variables individuales PG_*.
const databaseUrl = process.env.DATABASE_URL?.trim();

const poolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,
      // Supabase firma sus certificados con una CA propia; sin esto la conexión TLS falla.
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.PG_HOST || process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PG_PORT || process.env.PGPORT || '5432', 10),
      user: process.env.PG_USER || process.env.PGUSER || 'postgres',
      password: process.env.PG_PASSWORD || process.env.PGPASSWORD || 'postgres',
      database: process.env.PG_DATABASE || process.env.PGDATABASE || 'runlearn_db',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL] Error inesperado en el cliente inactivo del pool:', err);
});

export const query = (text, params) => pool.query(text, params);

export async function checkDbConnection() {
  try {
    const res = await pool.query('SELECT 1 AS connected');
    return { ok: res.rows.length > 0 && res.rows[0].connected === 1 };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export default {
  pool,
  query,
  checkDbConnection,
};
