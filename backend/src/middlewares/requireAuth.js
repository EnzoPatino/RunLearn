import jwt from 'jsonwebtoken';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET no está configurado');
  }

  return 'runlearn-dev-secret';
}

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const parts = authorization.trim().split(/\s+/);
  const scheme = parts[0];
  const token = parts[1];

  if (!scheme || !/^Bearer$/i.test(scheme) || !token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export default requireAuth;
