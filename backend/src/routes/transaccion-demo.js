import { Router } from 'express';
import { pool } from '../db/index.js';

const router = Router();

router.post('/', async (req, res) => {
  const { forzarError = false } = req.body || {};
  const client = await pool.connect();
  const log = [];

  try {
    const before = await client.query('SELECT id, titular, saldo FROM cuentas_demo ORDER BY id');
    log.push({ step: 'antes', data: before.rows });

    await client.query('BEGIN');
    log.push({ step: 'begin', message: 'BEGIN — transacción iniciada' });

    const alice = await client.query(
      'UPDATE cuentas_demo SET saldo = saldo - 150, updated_at = NOW() WHERE id = 1 RETURNING id, titular, saldo'
    );
    log.push({ step: 'update_origen', data: alice.rows[0], message: 'Alice: -150' });

    if (forzarError) {
      throw new Error('FALLO SIMULADO: fondos insuficientes oconstraint violation');
    }

    const bob = await client.query(
      'UPDATE cuentas_demo SET saldo = saldo + 150, updated_at = NOW() WHERE id = 2 RETURNING id, titular, saldo'
    );
    log.push({ step: 'update_destino', data: bob.rows[0], message: 'Bob: +150' });

    await client.query('COMMIT');
    log.push({ step: 'commit', message: 'COMMIT — transacción confirmada' });

    const after = await client.query('SELECT id, titular, saldo FROM cuentas_demo ORDER BY id');
    log.push({ step: 'despues', data: after.rows });

    return res.json({ ok: true, forzarError: false, log });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    log.push({ step: 'rollback', message: `ROLLBACK — ${error.message}` });

    const afterRollback = await client.query('SELECT id, titular, saldo FROM cuentas_demo ORDER BY id');
    log.push({ step: 'despues', data: afterRollback.rows });

    return res.json({ ok: false, forzarError: true, error: error.message, log });
  } finally {
    client.release();
  }
});

export default router;
