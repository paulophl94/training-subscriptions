import crypto from 'crypto';
import { getBaseUrl } from '../lib/base-url.js';
import { securePart } from '../lib/cookie-attrs.js';
import { verifyTransferToken } from '../lib/transfer-token.js';

const SESSION_COOKIE = '__session';
const TRANSFER_TTL_MS = 60_000;

/**
 * @param {string} email
 * @param {string} secret
 */
function signSession(email, secret) {
  const ts = Date.now();
  const sig = crypto.createHmac('sha256', secret).update(`${email}|${ts}`).digest('hex');
  return `${email}|${ts}|${sig}`;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    res.status(500).send('AUTH_SECRET nao configurado no Vercel');
    return;
  }

  const host = req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `http://${host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    res.status(400).send('Parametro token ausente');
    return;
  }

  const decoded = verifyTransferToken(token, authSecret, TRANSFER_TTL_MS);
  if (!decoded) {
    res.status(401).send('Token invalido ou expirado. Volte ao login e tente novamente.');
    return;
  }

  const base = getBaseUrl(req).replace(/\/$/, '');
  const expectedOrigin = decoded.origin.replace(/\/$/, '');
  if (expectedOrigin !== base) {
    res.status(403).send(
      'Este token nao foi emitido para este site. Verifique PUBLIC_BASE_URL no Vercel.',
    );
    return;
  }

  const sessionValue = signSession(decoded.email, authSecret);
  const sessionEncoded = encodeURIComponent(sessionValue);
  const sec = securePart(req);
  const sessionCookie = `${SESSION_COOKIE}=${sessionEncoded}; Path=/; HttpOnly${sec}; SameSite=Lax; Max-Age=604800`;

  res.setHeader('Set-Cookie', sessionCookie);
  res.writeHead(302, { Location: '/' });
  res.end();
}
