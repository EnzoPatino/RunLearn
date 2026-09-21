import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const router = Router();

// Configuración de la demo educativa
const WEAK_SECRET = '123456';
const SECURE_SECRET = process.env.JWT_SECRET || 'c8f94e16a2b85930e47f9184a56d2e8b174092b3c751e60f839a4b2c1d5e6f7a';

const DICTIONARY = [
  'admin',
  'password',
  '12345678',
  'qwerty',
  'secret',
  'supersecret',
  'root',
  '123456',
  'letmein',
  'welcome',
  'token',
  'default',
  'master',
  'jwtsecret',
  'pass123',
];

function getDefaultPayload() {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: 'usr_101',
    user: 'estudiante_demo',
    email: 'alumno@runlearn.dev',
    rol: 'user',
    iat: now,
    exp: now + 3600,
  };
}

function generateToken(mode) {
  const payload = getDefaultPayload();

  if (mode === 'secreto-debil') {
    const token = jwt.sign(payload, WEAK_SECRET, { algorithm: 'HS256' });
    const [hB64, pB64, sB64] = token.split('.');
    return {
      mode,
      token,
      parts: {
        header: { raw: hB64, decoded: { alg: 'HS256', typ: 'JWT' } },
        payload: { raw: pB64, decoded: payload },
        signature: { raw: sB64, info: `HMACSHA256(header.payload, "${WEAK_SECRET}")` },
      },
      secretInfo: {
        type: 'Débil / Trivial',
        value: WEAK_SECRET,
        entropy: 'Muy baja (~16 bits). Presente en cualquier diccionario común.',
        vulnerable: true,
      },
    };
  }

  if (mode === 'alg-none') {
    const headerObj = { alg: 'none', typ: 'JWT' };
    const hB64 = Buffer.from(JSON.stringify(headerObj)).toString('base64url');
    const pB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const token = `${hB64}.${pB64}.`;
    return {
      mode,
      token,
      parts: {
        header: { raw: hB64, decoded: headerObj },
        payload: { raw: pB64, decoded: payload },
        signature: { raw: '', info: 'Sin firma (alg: none). Integridad no protegida.' },
      },
      secretInfo: {
        type: 'Inexistente',
        value: 'N/A',
        entropy: '0 bits. Sin criptografía.',
        vulnerable: true,
      },
    };
  }

  // Modo seguro
  const token = jwt.sign(payload, SECURE_SECRET, { algorithm: 'HS256' });
  const [hB64, pB64, sB64] = token.split('.');
  return {
    mode: 'seguro',
    token,
    parts: {
      header: { raw: hB64, decoded: { alg: 'HS256', typ: 'JWT' } },
      payload: { raw: pB64, decoded: payload },
      signature: { raw: sB64, info: 'HMACSHA256(header.payload, [Secreto de 256 bits])' },
    },
    secretInfo: {
      type: 'Fuerte / Aleatorio',
      value: `${SECURE_SECRET.slice(0, 8)}... [256-bit entropy]`,
      entropy: '256 bits. Inmune a ataques de diccionario.',
      vulnerable: false,
    },
  };
}

function executeAttack(mode, originalToken) {
  const base = generateToken(mode);
  const token = originalToken || base.token;

  if (mode === 'secreto-debil') {
    const [hB64, pB64, sB64] = token.split('.');
    const message = `${hB64}.${pB64}`;

    const start = performance.now();
    let crackedSecret = null;
    let attempts = 0;
    const candidatesTested = [];

    for (const candidate of DICTIONARY) {
      attempts++;
      candidatesTested.push(candidate);
      const testSig = crypto.createHmac('sha256', candidate).update(message).digest('base64url');
      if (testSig === sB64) {
        crackedSecret = candidate;
        break;
      }
    }
    const elapsed = performance.now() - start;
    const timeMs = Math.max(0.04, Number(elapsed.toFixed(3)));

    const originalPayload = JSON.parse(Buffer.from(pB64, 'base64url').toString('utf8'));
    const forgedPayload = {
      ...originalPayload,
      rol: 'admin',
      escalated: true,
    };

    const forgedToken = jwt.sign(forgedPayload, crackedSecret, { algorithm: 'HS256' });
    const [fhB64, fpB64, fsB64] = forgedToken.split('.');

    let serverVerified = false;
    try {
      jwt.verify(forgedToken, WEAK_SECRET, { algorithms: ['HS256'] });
      serverVerified = true;
    } catch {
      serverVerified = false;
    }

    return {
      success: true,
      mode,
      attackType: 'Fuerza bruta de diccionario HMAC',
      crackedSecret,
      attempts,
      testedCandidates: candidatesTested,
      timeMs,
      originalRole: originalPayload.rol,
      newRole: forgedPayload.rol,
      forgedToken,
      forgedParts: {
        header: { raw: fhB64, decoded: { alg: 'HS256', typ: 'JWT' } },
        payload: { raw: fpB64, decoded: forgedPayload },
        signature: { raw: fsB64, info: `Firma válida forjada con secreto crackeado: "${crackedSecret}"` },
      },
      serverVerification: {
        valid: serverVerified,
        status: 200,
        assignedRole: forgedPayload.rol,
        message: `¡Ataque exitoso! Secreto descubierto ("${crackedSecret}") en ${timeMs}ms (${attempts} intentos). El servidor aceptó la firma manipulada y otorgó rol "admin".`,
      },
    };
  }

  if (mode === 'alg-none') {
    const [hB64, pB64] = token.split('.');
    const originalPayload = JSON.parse(Buffer.from(pB64, 'base64url').toString('utf8'));
    const forgedPayload = {
      ...originalPayload,
      rol: 'admin',
      escalated: true,
    };

    const forgedHeader = { alg: 'none', typ: 'JWT' };
    const fhB64 = Buffer.from(JSON.stringify(forgedHeader)).toString('base64url');
    const fpB64 = Buffer.from(JSON.stringify(forgedPayload)).toString('base64url');
    const forgedToken = `${fhB64}.${fpB64}.`;

    // Simulación de servidor vulnerable que no valida algoritmos ni exige firma
    return {
      success: true,
      mode,
      attackType: 'Bypass de firma con algoritmo "none"',
      crackedSecret: 'Innecesario (0 secretos requeridos)',
      attempts: 0,
      timeMs: 0.01,
      originalRole: originalPayload.rol,
      newRole: forgedPayload.rol,
      forgedToken,
      forgedParts: {
        header: { raw: fhB64, decoded: forgedHeader },
        payload: { raw: fpB64, decoded: forgedPayload },
        signature: { raw: '', info: 'Sin firma. El servidor vulnerable confía ciegamente en el header.' },
      },
      serverVerification: {
        valid: true,
        status: 200,
        assignedRole: forgedPayload.rol,
        message: '¡Ataque exitoso! Al cambiar alg a "none" y remover la firma, el servidor vulnerable confió en el payload y escaló a "admin" sin pedir contraseña ni secreto.',
      },
    };
  }

  // Modo seguro
  const [hB64, pB64, sB64] = token.split('.');
  const message = `${hB64}.${pB64}`;

  const start = performance.now();
  for (const candidate of DICTIONARY) {
    const testSig = crypto.createHmac('sha256', candidate).update(message).digest('base64url');
    if (testSig === sB64) break;
  }
  const elapsed = performance.now() - start;
  const timeMs = Math.max(0.08, Number(elapsed.toFixed(3)));

  const originalPayload = JSON.parse(Buffer.from(pB64, 'base64url').toString('utf8'));
  const forgedPayload = { ...originalPayload, rol: 'admin' };

  // Intento de forja: o alg: none o firma con clave inventada
  const forgedHeader = { alg: 'none', typ: 'JWT' };
  const fhB64 = Buffer.from(JSON.stringify(forgedHeader)).toString('base64url');
  const fpB64 = Buffer.from(JSON.stringify(forgedPayload)).toString('base64url');
  const forgedToken = `${fhB64}.${fpB64}.`;

  let serverVerified = false;
  let serverError = '';
  try {
    jwt.verify(forgedToken, SECURE_SECRET, { algorithms: ['HS256'] });
    serverVerified = true;
  } catch (err) {
    serverVerified = false;
    serverError = err.message;
  }

  return {
    success: false,
    mode: 'seguro',
    attackType: 'Fuerza bruta y forja de payload',
    crackedSecret: null,
    attempts: DICTIONARY.length,
    testedCandidates: DICTIONARY,
    timeMs,
    originalRole: originalPayload.rol,
    newRole: 'user',
    forgedToken,
    forgedParts: {
      header: { raw: fhB64, decoded: forgedHeader },
      payload: { raw: fpB64, decoded: forgedPayload },
      signature: { raw: '', info: 'Firma rechazada por el servidor' },
    },
    serverVerification: {
      valid: serverVerified,
      status: 401,
      assignedRole: null,
      error: serverError,
      message: `¡Ataque bloqueado! Se probaron ${DICTIONARY.length} secretos comunes en ${timeMs}ms sin éxito. El servidor rechazó alg="none" y exige firma válida HS256 con secreto de 256 bits (HTTP 401).`,
    },
  };
}

function verifyTokenOnServer(token, mode) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token inválido o vacío' };
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return { valid: false, error: 'Formato JWT inválido (faltan secciones)' };
  }

  try {
    let header = {};
    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch {
      return { valid: false, error: 'Header Base64Url corrupto' };
    }

    if (mode === 'alg-none') {
      // Simulación de servidor vulnerable
      if (header.alg === 'none') {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return {
          valid: true,
          status: 200,
          payload,
          rol: payload.rol,
          message: 'VULNERABILIDAD: Aceptado sin firma porque el servidor permite alg="none".',
        };
      }
    }

    if (mode === 'secreto-debil') {
      const decoded = jwt.verify(token, WEAK_SECRET, { algorithms: ['HS256'] });
      return {
        valid: true,
        status: 200,
        payload: decoded,
        rol: decoded.rol,
        message: 'Token verificado con secreto débil (123456).',
      };
    }

    // Modo seguro
    const decoded = jwt.verify(token, SECURE_SECRET, { algorithms: ['HS256'] });
    return {
      valid: true,
      status: 200,
      payload: decoded,
      rol: decoded.rol,
      message: 'Token verificado exitosamente con secreto seguro HS256 de 256 bits.',
    };
  } catch (err) {
    return {
      valid: false,
      status: 401,
      error: err.message,
      message: `Firma o algoritmo inválido: ${err.message}`,
    };
  }
}

/**
 * POST /api/jwt-demo
 * Body: { mode: 'secreto-debil' | 'alg-none' | 'seguro', action?: 'generate' | 'attack' | 'verify', token?: string }
 */
router.post('/', (req, res) => {
  try {
    const { mode = 'secreto-debil', action = 'generate', token } = req.body || {};

    if (!['secreto-debil', 'alg-none', 'seguro'].includes(mode)) {
      return res.status(400).json({
        error: 'El campo "mode" debe ser "secreto-debil", "alg-none" o "seguro".',
      });
    }

    if (action === 'attack') {
      const attackResult = executeAttack(mode, token);
      return res.json(attackResult);
    }

    if (action === 'verify') {
      const verification = verifyTokenOnServer(token, mode);
      return res.json(verification);
    }

    // Default: generate token and breakdown
    const generated = generateToken(mode);
    return res.json(generated);
  } catch (error) {
    return res.status(500).json({
      error: 'Error en la demo de JWT',
      message: error.message,
    });
  }
});

/**
 * POST /api/jwt-demo/verify
 * Body: { token: string, mode: string }
 */
router.post('/verify', (req, res) => {
  try {
    const { token, mode = 'seguro' } = req.body || {};
    const result = verifyTokenOnServer(token, mode);
    return res.status(result.valid ? 200 : 401).json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'Error en la verificación de JWT',
      message: error.message,
    });
  }
});

export default router;
