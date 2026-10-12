import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let cachedJwksUrl;
let cachedJwks;

function getSupabaseIssuer() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL no está configurado');
  }

  const projectUrl = new URL(supabaseUrl);
  if (!['http:', 'https:'].includes(projectUrl.protocol)) {
    throw new Error('SUPABASE_URL debe usar HTTP o HTTPS');
  }

  return `${projectUrl.origin}/auth/v1`;
}

function getRemoteJwks(issuer) {
  const jwksUrl = new URL(`${issuer}/.well-known/jwks.json`);

  if (!cachedJwks || cachedJwksUrl !== jwksUrl.href) {
    cachedJwks = createRemoteJWKSet(jwksUrl);
    cachedJwksUrl = jwksUrl.href;
  }

  return cachedJwks;
}

async function verifySupabaseToken(token, algorithm) {
  const issuer = getSupabaseIssuer();
  const verificationOptions = {
    issuer,
    audience: 'authenticated',
  };

  if (algorithm === 'HS256') {
    const secret = process.env.SUPABASE_JWT_SECRET;

    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET no está configurado para tokens HS256');
    }

    return jwtVerify(token, new TextEncoder().encode(secret), {
      ...verificationOptions,
      algorithms: ['HS256'],
    });
  }

  return jwtVerify(token, getRemoteJwks(issuer), verificationOptions);
}

function verifyRunLearnToken(token) {
  const secret = process.env.JWT_SECRET || (
    process.env.NODE_ENV === 'production' ? undefined : 'runlearn-dev-secret'
  );

  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload JWT inválido');
  }

  return payload;
}

async function resolveToken(token) {
  const { alg } = decodeProtectedHeader(token);

  if (alg === 'HS256') {
    try {
      const { payload } = await verifySupabaseToken(token, alg);
      return { provider: 'supabase', user: payload };
    } catch {
      // Los tokens HS256 propios del login se verifican con JWT_SECRET abajo.
    }

    try {
      return { provider: 'runlearn', user: verifyRunLearnToken(token) };
    } catch {
      throw new Error('Token inválido o expirado');
    }
  }

  const { payload } = await verifySupabaseToken(token, alg);
  return { provider: 'supabase', user: payload };
}

function isSupabaseUser(user) {
  return user?.role === 'authenticated' && typeof user.sub === 'string' && UUID_PATTERN.test(user.sub);
}

function createAuthMiddleware({ supabaseOnly = false } = {}) {
  return async function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.trim().split(/\s+/);

    if (!scheme || !/^Bearer$/i.test(scheme) || !token) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    try {
      const { provider, user } = await resolveToken(token);

      if (supabaseOnly && provider !== 'supabase') {
        return res.status(403).json({
          error: 'Este endpoint requiere un token de Supabase Auth; los tokens del login propio no están permitidos.',
        });
      }

      if (provider === 'supabase' && !isSupabaseUser(user)) {
        const status = supabaseOnly ? 403 : 401;
        return res.status(status).json({
          error: 'Se requiere un token de usuario de Supabase con sub UUID y role authenticated.',
        });
      }

      req.user = user;
      req.authProvider = provider;
      return next();
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}

export const requireAuth = createAuthMiddleware();
export const requireSupabaseAuth = createAuthMiddleware({ supabaseOnly: true });

export default requireAuth;
