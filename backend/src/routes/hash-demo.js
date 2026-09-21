import { Router } from 'express';
import bcrypt from 'bcrypt';

const router = Router();
const SALT_ROUNDS = 12;

router.post('/', async (req, res, next) => {
  try {
    const { password, mode } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Se requiere un campo "password" (string).' });
    }

    if (!['plain', 'hashed'].includes(mode)) {
      return res.status(400).json({ error: 'El campo "mode" debe ser "plain" o "hashed".' });
    }

    const start = performance.now();
    let storedValue;

    if (mode === 'plain') {
      storedValue = password;
    } else {
      storedValue = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const elapsed = performance.now() - start;

    res.json({
      mode,
      storedValue,
      timeMs: Math.round(elapsed * 100) / 100,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
