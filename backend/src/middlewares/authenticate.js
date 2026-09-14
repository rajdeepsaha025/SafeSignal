/**
 * middlewares/authenticate.js
 * Firebase ID Token verification middleware for SafeSignal.
 *
 * Auth flow:
 *   Authorization: Bearer <Firebase_ID_Token>
 *       ↓
 *   Extract token
 *       ↓
 *   Firebase Admin verifyIdToken()
 *       ↓
 *   Load Firestore user profile (create if first login)
 *       ↓
 *   Validate account status (ACTIVE / BLOCKED)
 *       ↓
 *   Attach enriched user to req.user
 *       ↓
 *   next()
 *
 * req.user shape after this middleware:
 * {
 *   uid:         string,
 *   email:       string,
 *   displayName: string,
 *   photoURL:    string | null,
 *   role:        'USER' | 'MODERATOR' | 'ADMIN',
 *   status:      'ACTIVE' | 'BLOCKED',
 *   token:       DecodedIdToken   // raw Firebase decoded token
 * }
 *
 * NEVER trust role from the token — always load from Firestore.
 */

import authService from '../services/AuthService.js';
import { extractBearerToken, getClientIp } from '../utils/tokenExtractor.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * authenticateFirebase middleware.
 * Verifies the Firebase ID Token and populates req.user.
 *
 * @type {import('express').RequestHandler}
 */
const authenticateFirebase = async (req, res, next) => {
  // ── Step 1: Extract token ──────────────────────────────────────────────────
  const token = extractBearerToken(req);

  if (!token) {
    return next(
      new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Missing authentication token. Include Authorization: Bearer <token> header.',
      )
    );
  }

  // ── Step 2: Run the full auth pipeline via AuthService ─────────────────────
  try {
    const user = await authService.authenticate(token, getClientIp(req));
    req.user = user;
    return next();
  } catch (err) {
    // AuthService throws structured objects, not Error instances
    const httpStatus = err.httpStatus ?? HTTP_STATUS.UNAUTHORIZED;
    const message    = err.message    ?? 'Authentication failed.';

    // Special handling for blocked accounts
    if (err.code === 'auth/user-blocked') {
      logger.warn('[Auth] Blocked user attempted access');
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, message));
    }

    return next(new ApiError(httpStatus, message));
  }
};

export default authenticateFirebase;
