/**
 * server.js
 * SafeSignal backend HTTP server entry point.
 *
 * Responsibilities:
 *   - Load environment variables
 *   - Boot the Express app
 *   - Start the HTTP listener
 *   - Handle graceful shutdown (SIGINT / SIGTERM)
 *   - Catch unhandled promise rejections and uncaught exceptions
 */

import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import logger from './config/logger.js';
import { SERVICE_NAME, API_VERSION } from './config/constants.js';

// ─── Create HTTP Server ────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
let isShuttingDown = false;

/**
 * Gracefully shuts down the server.
 * Stops accepting new connections and waits for in-flight requests to complete.
 *
 * @param {string} signal - OS signal that triggered shutdown
 */
function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      logger.error('Error during server close', { error: err.message });
      process.exit(1);
    }

    logger.info('HTTP server closed. All connections drained.');
    process.exit(0);
  });

  // Force-exit after 10 seconds if draining takes too long
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

// ─── Process Signal Handlers ───────────────────────────────────────────────────
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ─── Unhandled Rejection / Uncaught Exception ──────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack:  reason instanceof Error ? reason.stack   : undefined,
  });

  // Gracefully shut down after an unhandled rejection to prevent undefined state
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    message: err.message,
    stack:   err.stack,
  });

  // An uncaught exception is always fatal — exit immediately
  process.exit(1);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(env.PORT, () => {
  logger.info(`🚀 ${SERVICE_NAME} v${API_VERSION} is running`, {
    port:        env.PORT,
    environment: env.NODE_ENV,
    apiBase:     `http://localhost:${env.PORT}/api/v1`,
    health:      `http://localhost:${env.PORT}/api/v1/health`,
  });
});
