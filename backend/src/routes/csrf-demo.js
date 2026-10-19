import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// In-memory sessions for demo purposes (NOT the real auth system)
const sessions = new Map();

function createSession() {
  pruneExpiredSessions();
  const sessionId = crypto.randomBytes(16).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const balance = 50000;
  sessions.set(sessionId, { csrfToken, balance, createdAt: Date.now() });
  return { sessionId, csrfToken, balance };
}

const SESSION_TTL_MS = 30 * 60 * 1000;

function pruneExpiredSessions(removeOldest = false) {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
  if (removeOldest && sessions.size >= 1000) {
    const oldestId = sessions.keys().next().value;
    if (oldestId) sessions.delete(oldestId);
  }
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

// GET /token — issues a new session + CSRF token (simulates "login" and token generation)
router.get('/token', (req, res) => {
  if (sessions.size >= 1000) pruneExpiredSessions(true);
  const { sessionId, csrfToken, balance } = createSession();
  res.json({ sessionId, csrfToken, balance });
});

// POST /transferir y /transferir-segura — simulates a bank transfer
router.post(['/transferir', '/transferir-segura'], (req, res, next) => {
  try {
    const { sessionId, to, amount = 5000, csrfToken, mode = 'vulnerable' } = req.body || {};
    const determinedMode = req.path.endsWith('/transferir-segura') ? 'seguro' : mode;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Se requiere sessionId.' });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Sesión inválida. Iniciá sesión de nuevo.' });
    }

    if (!['vulnerable', 'seguro'].includes(determinedMode)) {
      return res.status(400).json({ error: 'El campo "mode" debe ser "vulnerable" o "seguro".' });
    }

    if (determinedMode === 'seguro') {
      // Secure: must provide valid CSRF token
      if (!csrfToken || csrfToken !== session.csrfToken) {
        return res.status(403).json({
          error: 'Token CSRF inválido o faltante. Petición rechazada.',
          code: 'CSRF_TOKEN_MISMATCH',
        });
      }
    }
    // Vulnerable: no CSRF check — only session cookie matters

    const transferAmount = Number(amount);
    if (!Number.isFinite(transferAmount) || transferAmount <= 0 || transferAmount > 50000) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor que 0 y no superar $50.000.' });
    }

    if (session.balance < transferAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente.' });
    }

    if (typeof to !== 'string' || !to.trim()) {
      return res.status(400).json({ error: 'Se requiere una cuenta de destino válida.' });
    }

    session.balance -= transferAmount;

    res.json({
      ok: true,
      mode: determinedMode,
      from: 'cuenta-12345',
      to: to.trim().slice(0, 100),
      amount: transferAmount,
      newBalance: session.balance,
      message: determinedMode === 'vulnerable'
        ? 'Transferencia procesada (sin validación CSRF).'
        : 'Transferencia procesada (token CSRF validado).',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
