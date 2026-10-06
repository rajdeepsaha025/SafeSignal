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

import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
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
 */
function buildCredential() {
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
      storageBucket: env.FIREBASE_STORAGE_BUCKET || `${env.FIREBASE_PROJECT_ID}.appspot.com`,
    };
  }

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
        credential: cert(serviceAccount),
        storageBucket:
          env.FIREBASE_STORAGE_BUCKET ||
          `${serviceAccount.project_id}.appspot.com`,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Initialises Firebase Admin SDK.
 */
function initFirebase() {
  if (getApps().length > 0) {
    const app = getApp();
    firestore = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
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
    const app = initializeApp(config);
    firestore = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    isFirebaseReady = true;

    // Use projectId directly from env as cert() projectId isn't easily accessible from config object
    console.log(`[Firebase] Admin SDK initialised. Project: ${env.FIREBASE_PROJECT_ID || 'loaded from file'}`);
  } catch (error) {
    console.error('[Firebase] Failed to initialise Admin SDK:', error.message);
    isFirebaseReady = false;
  }
}

initFirebase();

export { firestore, auth, storage, isFirebaseReady };

