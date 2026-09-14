/**
 * logger.js
 * Centralised logging utility for SafeSignal backend.
 *
 * Development : pretty-prints to console with colours.
 * Production  : writes structured JSON to logs/error.log and logs/access.log.
 *
 * Usage:
 *   import logger from '../config/logger.js';
 *   logger.info('Server started');
 *   logger.error('Something went wrong', error);
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Log directory ─────────────────────────────────────────────────────────────
const LOGS_DIR = path.resolve(__dirname, '../../logs');

if (env.isProd) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// ─── ANSI colour codes (dev only) ──────────────────────────────────────────────
const COLOURS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  info: '\x1b[36m',   // cyan
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
  debug: '\x1b[35m',  // magenta
};

// ─── Log level weights ─────────────────────────────────────────────────────────
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const ACTIVE_LEVEL = env.isDev ? 'debug' : 'info';

/**
 * Writes a log entry to a file (production).
 * @param {string} filePath - Absolute path to the log file.
 * @param {string} entry    - Serialised log line.
 */
function writeToFile(filePath, entry) {
  try {
    fs.appendFileSync(filePath, entry + '\n', 'utf8');
  } catch {
    // Swallow file write errors — don't crash the server over logging
  }
}

/**
 * Core log function.
 * @param {'info'|'warn'|'error'|'debug'} level
 * @param {string} message
 * @param {any}    [meta]
 */
function log(level, message, meta) {
  if (LEVELS[level] < LEVELS[ACTIVE_LEVEL]) return;

  const timestamp = new Date().toISOString();

  if (env.isDev) {
    const colour = COLOURS[level] || COLOURS.reset;
    const prefix = `${COLOURS.dim}[${timestamp}]${COLOURS.reset} ${colour}[${level.toUpperCase()}]${COLOURS.reset}`;
    const metaStr = meta ? ` ${JSON.stringify(meta, null, 0)}` : '';
    console.log(`${prefix} ${message}${metaStr}`);
  } else {
    const entry = JSON.stringify({ timestamp, level, message, ...(meta ? { meta } : {}) });

    if (level === 'error') {
      writeToFile(path.join(LOGS_DIR, 'error.log'), entry);
    }
    writeToFile(path.join(LOGS_DIR, 'access.log'), entry);
  }
}

const logger = {
  info:  (message, meta) => log('info',  message, meta),
  warn:  (message, meta) => log('warn',  message, meta),
  error: (message, meta) => log('error', message, meta),
  debug: (message, meta) => log('debug', message, meta),
};

export default logger;
