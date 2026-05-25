import { getBaseUrl } from './base-url.js';

/** @param {import('http').IncomingMessage} req */
export function securePart(req) {
  return getBaseUrl(req).startsWith('https') ? '; Secure' : '';
}
