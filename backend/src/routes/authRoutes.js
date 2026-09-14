/**
 * routes/authRoutes.js
 * Route definitions for authentication endpoints.
 *
 * All routes require a valid Firebase ID Token.
 *
 * GET  /api/v1/auth/me    — Returns current user's Firestore profile
 * POST /api/v1/auth/sync  — Syncs Firebase user with Firestore profile
 */

import { Router } from 'express';
import authenticateFirebase from '../middlewares/authenticate.js';
import { getMe, syncProfile } from '../controllers/authController.js';

const router = Router();

/**
 * @route   GET /api/v1/auth/me
 * @access  Protected (any authenticated user)
 * @desc    Returns the current user's Firestore profile including role
 */
router.get('/me', authenticateFirebase, getMe);

/**
 * @route   POST /api/v1/auth/sync
 * @access  Protected (any authenticated user)
 * @desc    Synchronises Firebase Auth user with Firestore profile.
 *          Creates profile if it does not exist.
 *          Call this immediately after Firebase login on the frontend.
 */
router.post('/sync', authenticateFirebase, syncProfile);

export default router;
