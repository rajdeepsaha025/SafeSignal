/**
 * controllers/authController.js
 * HTTP request handlers for authentication endpoints.
 *
 * Routes handled:
 *   GET  /api/v1/auth/me    — Returns the current authenticated user's profile
 *   POST /api/v1/auth/sync  — Syncs Firebase user with Firestore profile
 *
 * Controllers ONLY handle request/response.
 * All business logic lives in AuthService.
 */

import authService from '../services/AuthService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../config/constants.js';

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────

/**
 * Returns the full Firestore profile for the currently authenticated user.
 * req.user is guaranteed to be populated by authenticateFirebase middleware.
 */
export const getMe = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.uid);

  if (!profile) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      'User profile not found. Please call POST /auth/sync to create it.'
    );
  }

  // Never expose the raw decoded token to the client
  const { token: _token, ..._safeUser } = req.user;

  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(
      {
        uid:         profile.uid,
        email:       profile.email,
        displayName: profile.displayName,
        photoURL:    profile.photoURL,
        role:        profile.role,
        status:      profile.status,
        totalChecks:  profile.totalChecks,
        totalReports: profile.totalReports,
        createdAt:   profile.createdAt,
        lastLogin:   profile.lastLogin,
      },
      'Profile fetched successfully'
    )
  );
});

// ─── POST /api/v1/auth/sync ───────────────────────────────────────────────────

/**
 * Synchronises the Firebase user with their Firestore profile.
 * - If profile already exists → returns it.
 * - If first login → creates profile and returns it.
 *
 * This is safe to call multiple times (idempotent).
 */
export const syncProfile = asyncHandler(async (req, res) => {
  const profile = await authService.syncProfile(req.user);

  const isNewProfile = !profile.lastLogin ||
    Math.abs(new Date(profile.createdAt) - new Date(profile.lastLogin)) < 5000;

  return res.status(isNewProfile ? HTTP_STATUS.CREATED : HTTP_STATUS.OK).json(
    ApiResponse.success(
      {
        uid:         profile.uid,
        email:       profile.email,
        displayName: profile.displayName,
        photoURL:    profile.photoURL,
        role:        profile.role,
        status:      profile.status,
        createdAt:   profile.createdAt,
      },
      isNewProfile ? 'Profile created successfully' : 'Profile is up to date'
    )
  );
});
