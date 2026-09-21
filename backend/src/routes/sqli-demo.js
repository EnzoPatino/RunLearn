import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

/**
 * POST /api/sqli-demo
 * Body: { input: string, mode: 'vulnerable' | 'seguro' }
 *
 * Modo vulnerable: concatena el input directamente en el string SQL.
 * Modo seguro: usa query parametrizada ($1).
 *
 * ⚠️ El modo "vulnerable" es INTENCIONALMENTE inseguro para
 *    propósitos educativos. NUNCA usar concatenación de strings
 *    en código real.
 */
router.post('/', async (req, res) => {
  try {
    const { input = '', mode = 'vulnerable' } = req.body || {};

    if (typeof input !== 'string') {
      return res.status(400).json({ error: 'El campo "input" debe ser un string' });
    }

    if (!['vulnerable', 'seguro'].includes(mode)) {
      return res.status(400).json({ error: 'El campo "mode" debe ser "vulnerable" o "seguro"' });
    }

    const searchTerm = input.trim();
    if (!searchTerm) {
      return res.status(400).json({ error: 'El campo "input" no puede estar vacío' });
    }

    let sql;
    let result;

    if (mode === 'vulnerable') {
      // ⚠️ VULNERABLE A SQL INJECTION — solo para demo educativa
      sql = `SELECT id, nombre, email, rol FROM people WHERE nombre = '${searchTerm}'`;
      result = await query(sql);
    } else {
      // ✅ SEGURO: query parametrizada
      sql = 'SELECT id, nombre, email, rol FROM people WHERE nombre = $1';
      result = await query(sql, [searchTerm]);
    }

    return res.json({
      mode,
      sql,
      input: searchTerm,
      rowCount: result.rows.length,
      rows: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error al ejecutar la consulta',
      message: error.message,
    });
  }
});

export default router;
