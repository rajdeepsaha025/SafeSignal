/**
 * app.js
 * Express application factory for SafeSignal backend.
 *
 * Configures and wires together:
 *   - Security middleware (Helmet, CORS)
 *   - Compression and body parsing
 *   - Request logging (Morgan)
 *   - Rate limiting
 *   - API routes
 *   - Error handling
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { API_PREFIX, REQUEST } from './config/constants.js';
import { globalRateLimiter } from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ─── Trust proxy (required for rate limiter behind reverse proxy / load balancer)
app.set('trust proxy', 1);

// ─── Security ──────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: env.isProd,  // Enable CSP only in production
    crossOriginEmbedderPolicy: false,
  })
);

// Remove X-Powered-By
app.disable('x-powered-by');

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server, Postman)
      if (!origin) return callback(null, true);

      if (env.ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// ─── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: REQUEST.MAX_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: REQUEST.MAX_BODY_SIZE }));
app.use(cookieParser());

// ─── Request Logging (Morgan) ─────────────────────────────────────────────────
if (env.isDev) {
  // Coloured dev logging to console
  app.use(morgan('dev'));
} else {
  // Production: write access log to file
  const LOGS_DIR = path.resolve(__dirname, '../logs');
  fs.mkdirSync(LOGS_DIR, { recursive: true });

  const accessLogStream = fs.createWriteStream(
    path.join(LOGS_DIR, 'access.log'),
    { flags: 'a' }
  );

  app.use(morgan('combined', { stream: accessLogStream }));
}

// ─── Global Rate Limiter (health endpoint skipped internally) ──────────────────
app.use(globalRateLimiter);

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use(API_PREFIX, apiRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Centralised Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

export default app;
