import { next } from '@vercel/functions';

const SESSION_COOKIE = '__session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** @param {string} cookieHeader */
function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/**
 * @param {string} message
 * @param {string} secret
 * @returns {Promise<string>}
 */
async function hmacHex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * @param {string} value
 * @param {string} secret
 * @returns {Promise<boolean>}
 */
async function verifySession(value, secret) {
  if (!value || !secret) return false;
  const parts = value.split('|');
  if (parts.length !== 3) return false;
  const [email, tsStr, sig] = parts;
  if (!email || !tsStr || !sig) return false;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts) || Date.now() - ts > MAX_AGE_MS) return false;
  const expected = await hmacHex(`${email}|${tsStr}`, secret);
  if (expected.length !== sig.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return ok === 0;
}

export const config = {
  matcher: ['/', '/((?!api/|login\\.html).+)'],
};

/**
 * @param {Request} request
 */
export default async function middleware(request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return new Response('AUTH_SECRET nao configurado no Vercel', { status: 500 });
  }

  const raw = getCookie(request.headers.get('cookie') || '', SESSION_COOKIE);
  if (raw && (await verifySession(raw, secret))) {
    return next();
  }

  const login = new URL('/login.html', request.url);
  return Response.redirect(login, 302);
}
