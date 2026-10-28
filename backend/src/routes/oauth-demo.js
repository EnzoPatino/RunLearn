import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// Almacén en memoria de authorization codes (expiran en 60s)
const authCodes = new Map();
// Almacén de tokens emitidos
const tokens = new Map();

/**
 * POST /api/oauth-demo/authorize
 * Genera un authorization code a partir del code_challenge (PKCE).
 * Body: { clientId, redirectUri, codeChallenge, codeChallengeMethod, state }
 */
router.post('/authorize', (req, res) => {
  const { clientId, redirectUri, codeChallenge, codeChallengeMethod = 'S256', state } = req.body || {};

  if (!clientId || !codeChallenge) {
    return res.status(400).json({ error: 'clientId y codeChallenge son requeridos' });
  }

  // Generar authorization code único
  const code = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 60_000; // 60 segundos

  authCodes.set(code, {
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    state,
    expiresAt,
    used: false,
  });

  // Limpiar códigos expirados
  for (const [k, v] of authCodes.entries()) {
    if (v.expiresAt < Date.now()) authCodes.delete(k);
  }

  return res.json({
    authorizationCode: code,
    expiresIn: 60,
    redirectUri: redirectUri || 'https://myapp.example/callback',
    state,
    steps: [
      { step: 1, description: 'App genera code_verifier aleatorio (≥43 chars, 256 bits de entropía)' },
      { step: 2, description: 'App calcula code_challenge = BASE64URL(SHA-256(code_verifier))' },
      { step: 3, description: 'App redirige al Authorization Server con code_challenge' },
      { step: 4, description: 'Usuario se autentica y aprueba permisos (scopes)' },
      { step: 5, description: `Authorization Server emite código temporal: ${code.slice(0, 8)}…`, highlight: true },
      { step: 6, description: 'Código expira en 60s y es de un solo uso — nunca viaja por la URL final' },
    ],
  });
});

/**
 * POST /api/oauth-demo/token
 * Intercambia authorization code + code_verifier por access_token (PKCE flow).
 * Body: { code, codeVerifier, clientId, grantType }
 */
router.post('/token', (req, res) => {
  const { code, codeVerifier, clientId, grantType = 'authorization_code' } = req.body || {};

  if (grantType !== 'authorization_code') {
    return res.status(400).json({ error: `grant_type "${grantType}" no soportado en esta demo` });
  }

  if (!code || !codeVerifier) {
    return res.status(400).json({ error: 'code y codeVerifier son requeridos' });
  }

  const entry = authCodes.get(code);
  if (!entry) {
    return res.status(400).json({
      error: 'invalid_grant',
      description: 'El authorization code no existe o ya expiró (TTL: 60s)',
    });
  }
  if (entry.used) {
    return res.status(400).json({
      error: 'invalid_grant',
      description: 'El authorization code ya fue usado — posible replay attack',
    });
  }
  if (entry.expiresAt < Date.now()) {
    authCodes.delete(code);
    return res.status(400).json({
      error: 'invalid_grant',
      description: 'El authorization code expiró (>60s)',
    });
  }

  // Verificar PKCE: hash del code_verifier debe coincidir con code_challenge
  let computedChallenge;
  if (entry.codeChallengeMethod === 'S256') {
    computedChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  } else {
    // plain (no recomendado)
    computedChallenge = codeVerifier;
  }

  const pkceValid = computedChallenge === entry.codeChallenge;

  if (!pkceValid) {
    return res.status(400).json({
      error: 'invalid_grant',
      description: 'PKCE fallida: BASE64URL(SHA-256(code_verifier)) ≠ code_challenge',
      computed: computedChallenge,
      expected: entry.codeChallenge,
    });
  }

  // Invalidar código (one-time use)
  entry.used = true;

  // Emitir access token simulado
  const accessToken = crypto.randomBytes(24).toString('base64url');
  const refreshToken = crypto.randomBytes(16).toString('hex');
  const expiresIn = 3600;

  tokens.set(accessToken, {
    clientId,
    scopes: ['read:profile', 'read:email'],
    issuedAt: Date.now(),
    expiresAt: Date.now() + expiresIn * 1000,
  });

  return res.json({
    accessToken,
    tokenType: 'Bearer',
    expiresIn,
    refreshToken,
    scope: 'read:profile read:email',
    pkceVerification: {
      codeVerifier,
      sha256Hash: computedChallenge,
      codeChallenge: entry.codeChallenge,
      valid: pkceValid,
    },
    steps: [
      { step: 7, description: 'App envía code + code_verifier (nunca antes expuesto) al token endpoint' },
      { step: 8, description: `Server calcula SHA-256(code_verifier) → "${computedChallenge.slice(0, 16)}…"` },
      { step: 9, description: 'Compara con code_challenge almacenado — solo la app legítima tiene el verifier', highlight: true },
      { step: 10, description: `PKCE valida (S256 match) - access_token emitido: "${accessToken.slice(0, 12)}..."` },
      { step: 11, description: 'El code es marcado como usado — no puede reutilizarse (previene replay)' },
    ],
  });
});

/**
 * POST /api/oauth-demo/pkce-derive
 * Genera un code_verifier aleatorio y calcula su code_challenge S256.
 * Útil para que el frontend muestre el proceso de generación de PKCE en tiempo real.
 */
router.post('/pkce-derive', (req, res) => {
  const { verifier } = req.body || {};

  // Si no se provee uno, generamos uno aleatorio
  const codeVerifier = verifier || crypto.randomBytes(32).toString('base64url').slice(0, 64);
  const sha256Hex = crypto.createHash('sha256').update(codeVerifier).digest('hex');
  const sha256Base64 = crypto.createHash('sha256').update(codeVerifier).digest('base64');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  return res.json({
    codeVerifier,
    sha256Hex,
    sha256Base64,
    codeChallenge,
    method: 'S256',
    formula: 'BASE64URL(SHA-256(code_verifier))',
    breakdown: {
      step1: `code_verifier = "${codeVerifier.slice(0, 20)}…" (${codeVerifier.length} chars)`,
      step2: `SHA-256 → "${sha256Hex.slice(0, 16)}…" (32 bytes / 256 bits)`,
      step3: `Base64 estándar → "${sha256Base64.slice(0, 16)}…" (incluye +, /)`,
      step4: `Base64URL → "${codeChallenge.slice(0, 16)}…" (seguro para URL: - y _ en lugar de + y /)`,
    },
  });
});

export default router;
