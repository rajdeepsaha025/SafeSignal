/**
 * middlewares/authorize.js
 * Role-Based Access Control (RBAC) middleware factory.
 *
 * Must always be used AFTER authenticateFirebase middleware.
 * Reads role from req.user.role — populated from Firestore, never from token.
 *
 * Usage:
 *   import authenticateFirebase from './authenticate.js';
 *   import authorizeRoles from './authorize.js';
 *   import { ROLES } from '../config/constants.js';
 *
 *   // Single role
 *   router.get('/admin', authenticateFirebase, authorizeRoles(ROLES.ADMIN), handler);
 *
 *   // Multiple allowed roles
 *   router.patch('/report/:id', authenticateFirebase, authorizeRoles(ROLES.ADMIN, ROLES.MODERATOR), handler);
 */

import { ApiError } from '../utils/ApiError.js';
import { ROLES, HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';
import auditRepository from '../repositories/AuditRepository.js';
import { getClientIp } from '../utils/tokenExtractor.js';

/**
 * Returns a middleware that checks whether the authenticated user holds
 * at least one of the specified roles.
 *
 * @param {...string} allowedRoles - One or more ROLES.* values
 * @returns {import('express').RequestHandler}
 */
const authorizeRoles = (...allowedRoles) => async (req, res, next) => {
  // Guard: authenticate middleware must run first
  if (!req.user) {
    return next(
      new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User is not authenticated.')
    );
  }

  const userRole = req.user.role ?? ROLES.USER;

  // Role check
  if (!allowedRoles.includes(userRole)) {
    const message = `Access denied. Required: ${allowedRoles.join(' or ')}. Your role: ${userRole}.`;

    logger.warn('[RBAC] Role violation', {
      uid:          req.user.uid,
      userRole,
      requiredRoles: allowedRoles,
      path:         req.originalUrl,
      method:       req.method,
    });

    // Log to audit_logs asynchronously (non-blocking)
    auditRepository.log({
      userId:    req.user.uid,
      action:    'ROLE_VIOLATION',
      resource:  req.originalUrl,
      ipAddress: getClientIp(req),
      metadata: {
        userRole,
        requiredRoles: allowedRoles,
        method: req.method,
      },
    }).catch(() => {}); // Swallow audit log errors — never break the request

    return next(new ApiError(HTTP_STATUS.FORBIDDEN, message));
  }

  return next();
};

export default authorizeRoles;
