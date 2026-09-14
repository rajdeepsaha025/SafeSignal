/**
 * utils/tokenExtractor.js
 * Utilities for extracting and parsing authentication tokens from requests.
 */

/**
 * Extracts the Bearer token from the Authorization header.
 * Returns null if the header is absent or malformed.
 *
 * @param {import('express').Request} req
 * @returns {string|null}
 */
export function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  if (!header.startsWith('Bearer ')) return null;

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Returns the client IP address from the request.
 * Respects X-Forwarded-For when behind a trusted proxy.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Returns a sanitised User-Agent string (truncated for log safety).
 * @param {import('express').Request} req
 * @returns {string}
 */
export function getUserAgent(req) {
  const ua = req.headers['user-agent'] ?? 'unknown';
  return ua.slice(0, 200);
}
