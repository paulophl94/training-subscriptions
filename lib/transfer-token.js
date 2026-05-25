import crypto from 'crypto';

const SEP = '\x1e';

/**
 * @param {string} token
 * @param {string} secret
 * @param {number} maxAgeMs
 * @returns {{ email: string, origin: string } | null}
 */
export function verifyTransferToken(token, secret, maxAgeMs) {
  if (!token || !secret) return null;
  let inner;
  try {
    inner = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const parts = inner.split(SEP);
  if (parts.length !== 4) return null;
  const [email, tsStr, origin, sig] = parts;
  if (!email || !tsStr || !origin || !sig) return null;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts) || Date.now() - ts > maxAgeMs) return null;
  const payload = `${email}${SEP}${tsStr}${SEP}${origin}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (expected.length !== sig.length) return null;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (ok !== 0) return null;
  return { email, origin };
}
