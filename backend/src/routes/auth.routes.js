import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const router = Router();
const SALT_ROUNDS = 12;
const DEFAULT_ROLE = 'user';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET no está configurado');
  }

  return 'runlearn-dev-secret';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function buildAuthPayload(user) {
  return {
    id: user.id,
    email: user.email,
    rol: user.rol,
  };
}

function signToken(user) {
  return jwt.sign(buildAuthPayload(user), getJwtSecret(), {
    subject: String(user.id),
    expiresIn: JWT_EXPIRES_IN,
  });
}

router.post('/register', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    getJwtSecret();

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      `INSERT INTO users (email, password_hash, rol)
       VALUES ($1, $2, $3)
       RETURNING id, email, rol, created_at`,
      [email, passwordHash, DEFAULT_ROLE],
    );
    const user = result.rows[0];

    return res.status(201).json({
      user,
      token: signToken(user),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body || {};

    if (!isValidEmail(email) || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email o contraseña inválidos' });
    }

    const result = await query(
      'SELECT id, email, password_hash, rol, created_at FROM users WHERE email = $1',
      [email],
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        created_at: user.created_at,
      },
      token: signToken(user),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
