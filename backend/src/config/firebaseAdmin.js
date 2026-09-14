/**
 * firebaseAdmin.js
 * Initialises the Firebase Admin SDK once and exports shared service instances.
 *
 * Exports:
 *   firestore  — Cloud Firestore instance
 *   auth       — Firebase Authentication instance
 *   storage    — Firebase Storage instance
 *   isFirebaseReady — boolean flag for health checks
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firestore = null;
let auth = null;
let storage = null;
let isFirebaseReady = false;

/**
 * Builds Firebase credential from environment variables or service account file.
 * Priority:
 *   1. Explicit env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 *   2. Local service account JSON file (development only)
 */
function buildCredential() {
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
      storageBucket: env.FIREBASE_STORAGE_BUCKET || `${env.FIREBASE_PROJECT_ID}.appspot.com`,
    };
  }

  // Fallback: service account JSON file (dev convenience)
  if (env.isDev) {
    try {
      const require = createRequire(import.meta.url);
      const serviceAccountPath = path.resolve(
        __dirname,
        '../../config/serviceAccountKey.json'
      );
      const serviceAccount = require(serviceAccountPath);

      console.log('[Firebase] Using local service account key file.');

      return {
        credential: admin.credential.cert(serviceAccount),
        storageBucket:
          env.FIREBASE_STORAGE_BUCKET ||
          `${serviceAccount.project_id}.appspot.com`,
      };
    } catch {
      // Service account file not present — Firebase will not be available
      return null;
    }
  }

  return null;
}

/**
 * Initialises Firebase Admin SDK.
 * Safe to call multiple times — will skip if already initialised.
 */
function initFirebase() {
  if (admin.apps.length > 0) {
    // Already initialised
    const app = admin.apps[0];
    firestore = admin.firestore(app);
    auth = admin.auth(app);
    storage = admin.storage(app);
    isFirebaseReady = true;
    return;
  }

  const config = buildCredential();

  if (!config) {
    console.warn(
      '[Firebase] No credentials found. Firebase services will be unavailable. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env ' +
        'or place a serviceAccountKey.json in backend/config/.'
    );
    return;
  }

  try {
    const app = admin.initializeApp(config);

    firestore = admin.firestore(app);
    auth = admin.auth(app);
    storage = admin.storage(app);
    isFirebaseReady = true;

    console.log(
      `[Firebase] Admin SDK initialised. Project: ${config.credential.projectId ?? 'loaded from file'}`
    );
  } catch (error) {
    console.error('[Firebase] Failed to initialise Admin SDK:', error.message);
    isFirebaseReady = false;
  }
}

initFirebase();

export { firestore, auth, storage, isFirebaseReady };
