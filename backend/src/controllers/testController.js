/**
 * controllers/testController.js
 * Role-verification test endpoints.
 *
 * Purpose: Verify that the authentication and RBAC middleware
 * pipeline works end-to-end before building feature APIs.
 *
 * Routes:
 *   GET /api/v1/test/user       — Requires USER role
 *   GET /api/v1/test/moderator  — Requires MODERATOR role
 *   GET /api/v1/test/admin      — Requires ADMIN role
 *
 * These routes should be DISABLED or REMOVED in production.
 */

import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../config/constants.js';
import { getPermissions } from '../utils/permissions.js';

/**
 * Builds a consistent test response showing who passed auth + RBAC.
 */
const buildTestResponse = (req, label) => ({
  message:     `✅ ${label} access granted`,
  uid:         req.user.uid,
  email:       req.user.email,
  displayName: req.user.displayName,
  role:        req.user.role,
  permissions: getPermissions(req.user.role),
  timestamp:   new Date().toISOString(),
});

// GET /api/v1/test/user
export const testUser = asyncHandler(async (req, res) => {
  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(buildTestResponse(req, 'USER'), 'User route test passed')
  );
});

// GET /api/v1/test/moderator
export const testModerator = asyncHandler(async (req, res) => {
  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(buildTestResponse(req, 'MODERATOR'), 'Moderator route test passed')
  );
});

// GET /api/v1/test/admin
export const testAdmin = asyncHandler(async (req, res) => {
  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(buildTestResponse(req, 'ADMIN'), 'Admin route test passed')
  );
});
