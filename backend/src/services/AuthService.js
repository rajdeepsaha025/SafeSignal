/**
 * services/AuthService.js
 * Business logic for Firebase Authentication in SafeSignal.
 *
 * Responsibilities:
 *   - Verify Firebase ID Token via Admin SDK
 *   - Load / create Firestore user profile
 *   - Check user status (blocked check)
 *   - Record login events
 *   - Log auth events to audit_logs
 *
 * NEVER implements JWT. Firebase Auth IS the identity provider.
 * NEVER reads role from token — always loads from Firestore.
 */

import { auth } from '../config/firebaseAdmin.js';
import authRepository from '../repositories/AuthRepository.js';
import auditRepository from '../repositories/AuditRepository.js';
import { USER_STATUS, ROLES } from '../config/constants.js';
import logger from '../config/logger.js';

class AuthService {
  // ─── Token Verification ───────────────────────────────────────────────────────

  /**
   * Verifies a Firebase ID Token using the Admin SDK.
   * Returns the decoded token payload on success.
   * Throws a typed error on failure (expired, invalid, revoked).
   *
   * @param {string} idToken - Raw Bearer token from Authorization header
   * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
   * @throws {{ code: string, message: string }}
   */
  async verifyToken(idToken) {
    if (!auth) {
      throw { code: 'auth/service-unavailable', message: 'Authentication service is unavailable' };
    }

    try {
      // checkRevoked=true rejects tokens that were revoked via the Admin SDK
      const decoded = await auth.verifyIdToken(idToken, true);
      return decoded;
    } catch (err) {
      // Map Firebase error codes to readable messages
      throw this._mapFirebaseAuthError(err);
    }
  }

  // ─── Profile Management ───────────────────────────────────────────────────────

  /**
   * Loads the Firestore profile for a verified user.
   * If no profile exists (first-ever login), creates one automatically.
   *
   * @param {import('firebase-admin/auth').DecodedIdToken} decodedToken
   * @returns {Promise<object>} - Firestore user profile
   */
  async getOrCreateProfile(decodedToken) {
    const { uid, email, name, picture } = decodedToken;

    const profile = await authRepository.syncProfile(uid, {
      uid,
      email: email ?? '',
      name:  name  ?? email?.split('@')[0] ?? '',
      picture: picture ?? null,
    });

    return profile;
  }

  /**
   * Validates that the user's account is ACTIVE.
   * @param {object} profile - Firestore user profile
   * @throws {{ code: string, message: string }}
   */
  validateUserStatus(profile) {
    if (profile.status === USER_STATUS.BLOCKED) {
      throw {
        code:    'auth/user-blocked',
        message: 'Account has been blocked. Contact support for assistance.',
      };
    }
  }

  /**
   * Full authentication pipeline:
   *   1. Verify token
   *   2. Load / create profile
   *   3. Validate status
   *   4. Return enriched user object
   *
   * @param {string} idToken
   * @param {string} [ipAddress]
   * @returns {Promise<object>} - Enriched user object for req.user
   */
  async authenticate(idToken, ipAddress = null) {
    // Step 1: Verify token signature & expiry
    const decoded = await this.verifyToken(idToken);

    // Step 2: Load Firestore profile (create if first login)
    const profile = await this.getOrCreateProfile(decoded);

    // Step 3: Check account status
    this.validateUserStatus(profile);

    // Step 4: Record login asynchronously (do not await — non-blocking)
    this._recordLogin(profile.uid, ipAddress).catch((err) =>
      logger.warn('[AuthService] Failed to record login', { uid: profile.uid, error: err.message })
    );

    // Step 5: Return enriched user (role from Firestore — NEVER from token)
    return {
      uid:         profile.uid,
      email:       profile.email,
      displayName: profile.displayName,
      photoURL:    profile.photoURL,
      role:        profile.role   ?? ROLES.USER,
      status:      profile.status ?? USER_STATUS.ACTIVE,
      // Attach decoded token for downstream use (e.g., custom claims)
      token:       decoded,
    };
  }

  /**
   * Returns the current Firestore profile for an authenticated user.
   * Used by GET /auth/me.
   *
   * @param {string} uid
   * @returns {Promise<object|null>}
   */
  async getProfile(uid) {
    return authRepository.findByUid(uid);
  }

  /**
   * Syncs a Firebase user with their Firestore profile.
   * Creates profile if it does not exist; returns existing profile otherwise.
   * Used by POST /auth/sync.
   *
   * @param {object} user - req.user (already verified by middleware)
   * @returns {Promise<object>}
   */
  async syncProfile(user) {
    const profile = await authRepository.findByUid(user.uid);

    if (!profile) {
      await authRepository.createProfile(user.uid, {
        email:       user.email       ?? '',
        displayName: user.displayName ?? '',
        photoURL:    user.photoURL    ?? null,
      });
      return authRepository.findByUid(user.uid);
    }

    return profile;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  /**
   * Records a login event in audit_logs and updates lastLogin.
   * @private
   */
  async _recordLogin(uid, ipAddress) {
    await Promise.all([
      authRepository.updateLastLogin(uid),
      auditRepository.log({
        userId:    uid,
        action:    'USER_LOGIN',
        resource:  `users/${uid}`,
        ipAddress: ipAddress ?? null,
        metadata:  { timestamp: new Date().toISOString() },
      }),
    ]);
  }

  /**
   * Maps Firebase Admin SDK error codes to structured error objects.
   * @private
   * @param {Error} err
   * @returns {{ code: string, message: string, httpStatus: number }}
   */
  _mapFirebaseAuthError(err) {
    const code = err.code ?? 'auth/unknown';

    const map = {
      'auth/id-token-expired':      { message: 'Authentication token has expired. Please sign in again.',   httpStatus: 401 },
      'auth/id-token-revoked':      { message: 'Authentication token has been revoked. Please sign in again.', httpStatus: 401 },
      'auth/invalid-id-token':      { message: 'Invalid authentication token.',                             httpStatus: 401 },
      'auth/user-disabled':         { message: 'This Firebase account has been disabled.',                   httpStatus: 403 },
      'auth/argument-error':        { message: 'Malformed authentication token.',                            httpStatus: 401 },
      'auth/service-unavailable':   { message: 'Authentication service is temporarily unavailable.',        httpStatus: 503 },
    };

    const mapped = map[code] ?? { message: 'Authentication failed.', httpStatus: 401 };

    logger.warn(`[AuthService] Token verification failed: ${code}`, { message: err.message });

    return { code, ...mapped };
  }
}

export default new AuthService();
