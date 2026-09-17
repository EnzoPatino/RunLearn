import { Router } from 'express';
import { query } from '../db/index.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = Router();

// Todas las operaciones de /api/people requieren autenticación
router.use(requireAuth);

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidId(id) {
  return /^\d+$/.test(String(id).trim());
}

/**
 * GET /api/people
 * Obtener lista completa de personas
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, nombre, email, rol, created_at FROM people ORDER BY id ASC'
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/people/:id
 * Obtener una persona por su ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'El parámetro ID debe ser un número entero válido' });
    }

    const result = await query(
      'SELECT id, nombre, email, rol, created_at FROM people WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Persona con ID ${id} no encontrada` });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/people
 * Crear un nuevo registro de persona
 */
router.post('/', async (req, res, next) => {
  try {
    const { nombre, email, rol = 'estudiante' } = req.body || {};

    const cleanNombre = typeof nombre === 'string' ? nombre.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanRol = typeof rol === 'string' && rol.trim().length > 0 ? rol.trim() : 'estudiante';

    if (!cleanNombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'El campo "email" debe tener un formato válido' });
    }

    const result = await query(
      `INSERT INTO people (nombre, email, rol)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, email, rol, created_at`,
      [cleanNombre, cleanEmail, cleanRol]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una persona registrada con ese email' });
    }
    return next(error);
  }
});

/**
 * PUT /api/people/:id
 * Actualizar una persona existente por su ID
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'El parámetro ID debe ser un número entero válido' });
    }

    // Verificar existencia previa
    const existing = await query('SELECT id, nombre, email, rol FROM people WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: `Persona con ID ${id} no encontrada` });
    }

    const { nombre, email, rol } = req.body || {};

    if (nombre === undefined && email === undefined && rol === undefined) {
      return res.status(400).json({ error: 'Debe proveer al menos un campo para actualizar (nombre, email o rol)' });
    }

    const cleanNombre = nombre !== undefined ? String(nombre).trim() : null;
    const cleanEmail = email !== undefined ? String(email).trim().toLowerCase() : null;
    const cleanRol = rol !== undefined ? String(rol).trim() : null;

    if (cleanNombre !== null && cleanNombre.length === 0) {
      return res.status(400).json({ error: 'El campo "nombre" no puede estar vacío' });
    }

    if (cleanEmail !== null && !isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'El campo "email" debe tener un formato válido' });
    }

    if (cleanRol !== null && cleanRol.length === 0) {
      return res.status(400).json({ error: 'El campo "rol" no puede estar vacío' });
    }

    const result = await query(
      `UPDATE people
       SET nombre = COALESCE($1, nombre),
           email = COALESCE($2, email),
           rol = COALESCE($3, rol)
       WHERE id = $4
       RETURNING id, nombre, email, rol, created_at`,
      [cleanNombre, cleanEmail, cleanRol, id]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una persona registrada con ese email' });
    }
    return next(error);
  }
});

/**
 * DELETE /api/people/:id
 * Eliminar una persona por su ID
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'El parámetro ID debe ser un número entero válido' });
    }

    const result = await query(
      'DELETE FROM people WHERE id = $1 RETURNING id, nombre, email, rol, created_at',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Persona con ID ${id} no encontrada` });
    }

    return res.json({
      message: 'Persona eliminada exitosamente',
      deleted: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
