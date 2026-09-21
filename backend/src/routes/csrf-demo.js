import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// In-memory sessions for demo purposes (NOT the real auth system)
const sessions = new Map();

function createSession() {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const balance = 50000;
  sessions.set(sessionId, { csrfToken, balance });
  return { sessionId, csrfToken, balance };
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

// GET /token — issues a new session + CSRF token (simulates "login" and token generation)
router.get('/token', (req, res) => {
  const { sessionId, csrfToken, balance } = createSession();
  res.json({ sessionId, csrfToken, balance });
});

// POST /transferir — simulates a bank transfer
router.post('/transferir', (req, res, next) => {
  try {
    const { sessionId, to, amount, csrfToken, mode } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Se requiere sessionId.' });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Sesión inválida. Iniciá sesión de nuevo.' });
    }

    if (!['vulnerable', 'seguro'].includes(mode)) {
      return res.status(400).json({ error: 'El campo "mode" debe ser "vulnerable" o "seguro".' });
    }

    if (mode === 'seguro') {
      // Secure: must provide valid CSRF token
      if (!csrfToken || csrfToken !== session.csrfToken) {
        return res.status(403).json({
          error: 'Token CSRF inválido o faltante. Petición rechazada.',
          code: 'CSRF_TOKEN_MISMATCH',
        });
      }
    }
    // Vulnerable: no CSRF check — only session cookie matters

    const transferAmount = Number(amount) || 5000;

    if (session.balance < transferAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente.' });
    }

    session.balance -= transferAmount;

    res.json({
      ok: true,
      mode,
      from: 'cuenta-12345',
      to: to || 'cuenta-attacker-99999',
      amount: transferAmount,
      newBalance: session.balance,
      message: mode === 'vulnerable'
        ? 'Transferencia procesada (sin validación CSRF).'
        : 'Transferencia procesada (token CSRF validado).',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
