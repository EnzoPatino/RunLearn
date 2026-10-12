import { Router } from 'express';
import { query } from '../db/index.js';
import { requireSupabaseAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.use(requireSupabaseAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT clase_id, completado, updated_at
       FROM progreso
       WHERE user_id = $1
       ORDER BY clase_id ASC`,
      [req.user.sub],
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.put('/', async (req, res, next) => {
  const { clase_id: claseId, completado } = req.body || {};

  if (typeof claseId !== 'string' || !claseId.trim()) {
    return res.status(400).json({ error: 'El campo "clase_id" es obligatorio' });
  }

  if (typeof completado !== 'boolean') {
    return res.status(400).json({ error: 'El campo "completado" debe ser booleano' });
  }

  try {
    const result = await query(
      `INSERT INTO progreso (user_id, clase_id, completado)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, clase_id)
       DO UPDATE SET completado = EXCLUDED.completado, updated_at = now()
       RETURNING clase_id, completado, updated_at`,
      [req.user.sub, claseId.trim(), completado],
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

export default router;
