/**
 * dateUtils.js
 * Date / time utility helpers for SafeSignal backend.
 * All times are UTC internally; IST formatting is for display only.
 */

// ─── Constants ─────────────────────────────────────────────────────────────────
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Returns the current UTC timestamp as an ISO 8601 string.
 * @returns {string}
 */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * Returns the current Unix epoch in milliseconds.
 * @returns {number}
 */
export function nowMs() {
  return Date.now();
}

/**
 * Converts a Date object (or ISO string) to Indian Standard Time string.
 * @param {Date|string} date
 * @returns {string}
 */
export function toIST(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().replace('Z', '+05:30');
}

/**
 * Returns a Date that is `days` calendar days ago from now (UTC).
 * @param {number} days
 * @returns {Date}
 */
export function daysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * Returns a Date that is `hours` hours ago from now (UTC).
 * @param {number} hours
 * @returns {Date}
 */
export function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

/**
 * Formats milliseconds into a human-readable duration string.
 * e.g. 3723000 → "1h 2m 3s"
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours   > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Checks if a given date is within the last N minutes.
 * @param {Date|string} date
 * @param {number}      minutes
 * @returns {boolean}
 */
export function isWithinMinutes(date, minutes) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Date.now() - d.getTime() < minutes * 60 * 1000;
}
