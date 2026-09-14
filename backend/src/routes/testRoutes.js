/**
 * routes/testRoutes.js
 * RBAC verification test routes.
 *
 * These routes exist only to verify the authentication and role middleware
 * pipeline works correctly. Remove or protect behind NODE_ENV check in production.
 *
 * GET /api/v1/test/user       — Requires USER role or higher
 * GET /api/v1/test/moderator  — Requires MODERATOR role or higher
 * GET /api/v1/test/admin      — Requires ADMIN role only
 */

import { Router } from 'express';
import authenticateFirebase from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorize.js';
import { testUser, testModerator, testAdmin } from '../controllers/testController.js';
import { ROLES } from '../config/constants.js';

const router = Router();

/**
 * @route   GET /api/v1/test/user
 * @access  Protected — USER, MODERATOR, ADMIN
 */
router.get(
  '/user',
  authenticateFirebase,
  authorizeRoles(ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN),
  testUser
);

/**
 * @route   GET /api/v1/test/moderator
 * @access  Protected — MODERATOR, ADMIN
 */
router.get(
  '/moderator',
  authenticateFirebase,
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  testModerator
);

/**
 * @route   GET /api/v1/test/admin
 * @access  Protected — ADMIN only
 */
router.get(
  '/admin',
  authenticateFirebase,
  authorizeRoles(ROLES.ADMIN),
  testAdmin
);

export default router;
