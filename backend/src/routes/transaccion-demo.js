import { Router } from 'express';
import { pool } from '../db/index.js';

const router = Router();

router.post('/', async (req, res) => {
  const { forzarError = false } = req.body || {};
  if (typeof forzarError !== 'boolean') {
    return res.status(400).json({ error: 'El campo "forzarError" debe ser booleano.' });
  }

  const client = await pool.connect();
  const log = [];
  let transactionStarted = false;

  try {
    const before = await client.query('SELECT id, titular, saldo FROM cuentas_demo ORDER BY id');
    log.push({ step: 'antes', data: before.rows });

    await client.query('BEGIN');
    transactionStarted = true;
    const lockedAccounts = await client.query('SELECT id FROM cuentas_demo WHERE id IN (1, 2) ORDER BY id FOR UPDATE');
    if (lockedAccounts.rowCount !== 2) {
      throw new Error('No se encontraron las cuentas de demostración necesarias.');
    }
    log.push({ step: 'begin', message: 'BEGIN — transacción iniciada' });

    const alice = await client.query(
      'UPDATE cuentas_demo SET saldo = saldo - 150, updated_at = NOW() WHERE id = 1 AND saldo >= 150 RETURNING id, titular, saldo'
    );
    if (!alice.rowCount) throw new Error('Alice no tiene saldo suficiente para transferir $150.');
    log.push({ step: 'update_origen', data: alice.rows[0], message: 'Alice: -150' });

    if (forzarError) {
      throw new Error('FALLO SIMULADO: fondos insuficientes oconstraint violation');
    }

    const bob = await client.query(
      'UPDATE cuentas_demo SET saldo = saldo + 150, updated_at = NOW() WHERE id = 2 RETURNING id, titular, saldo'
    );
    if (!bob.rowCount) throw new Error('No se encontró la cuenta de destino de la demostración.');
    log.push({ step: 'update_destino', data: bob.rows[0], message: 'Bob: +150' });

    await client.query('COMMIT');
    log.push({ step: 'commit', message: 'COMMIT — transacción confirmada' });

    const after = await client.query('SELECT id, titular, saldo FROM cuentas_demo ORDER BY id');
    log.push({ step: 'despues', data: after.rows });

    return res.json({ ok: true, forzarError: false, log });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK').catch(() => {});
    log.push({ step: 'rollback', message: `ROLLBACK — ${error.message}` });

    try {
      const afterRollback = await client.query('SELECT id, titular, saldo FROM cuentas_demo ORDER BY id');
      log.push({ step: 'despues', data: afterRollback.rows });
    } catch {
      return res.status(500).json({ error: 'No se pudo completar la demostración de transacciones.' });
    }

    return res.json({ ok: false, forzarError, error: error.message, log });
  } finally {
    client.release();
  }
});

export default router;
