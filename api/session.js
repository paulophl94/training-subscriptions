const crypto = require('crypto');

const ALLOWED_DOMAINS = ['nuvemshop.com.br', 'tiendanube.com'];
const COOKIE_NAME = 'rh_session';
const COOKIE_MAX_AGE = 8 * 60 * 60;

function sign(payload, secret) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  return b64 + '.' + sig;
}

function decodeJwtPayload(token) {
  const seg = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(seg, 'base64').toString('utf-8'));
}

function setCookie(name, value, maxAge) {
  return [name + '=' + value, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=' + maxAge].join('; ');
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', setCookie(COOKIE_NAME, '', 0));
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server misconfigured' });

  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  let user;
  try {
    user = decodeJwtPayload(credential);
  } catch (_) {
    return res.status(401).json({ error: 'Invalid credential' });
  }

  const domain = (user.email || '').split('@')[1];
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }
  if (user.exp && user.exp * 1000 < Date.now()) {
    return res.status(401).json({ error: 'Credential expired' });
  }

  const sessionValue = sign({ email: user.email, name: user.name, exp: user.exp }, secret);
  res.setHeader('Set-Cookie', setCookie(COOKIE_NAME, sessionValue, COOKIE_MAX_AGE));
  return res.status(200).json({ ok: true });
};
