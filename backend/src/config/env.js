/**
 * env.js
 * Centralised environment variable validation and export.
 * All environment access throughout the codebase should go through this module.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REQUIRED_VARS = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

/**
 * Validates that all required environment variables are present.
 * Throws an error on startup if any are missing in production.
 */
function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (missing.length > 0) {
    console.warn(
      `[WARN] Missing environment variables: ${missing.join(', ')}. ` +
        'Firebase will not initialize correctly.'
    );
  }
}

validateEnv();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(
    /\\n/g,
    '\n'
  ),
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',

  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'placeholder_only',

  // External services
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',

  // CORS
  ALLOWED_ORIGINS: (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:5173,http://localhost:3000'
  )
    .split(',')
    .map((o) => o.trim()),

  // Helpers
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
};
