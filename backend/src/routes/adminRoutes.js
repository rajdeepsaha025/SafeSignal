import { Router } from 'express';

import authenticateFirebase from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../config/constants.js';

import * as adminUserController from '../controllers/admin/AdminUserController.js';
import * as adminUPIController from '../controllers/admin/AdminUPIController.js';
import * as adminConfigController from '../controllers/admin/AdminConfigController.js';
import * as adminAuditController from '../controllers/admin/AdminAuditController.js';
import * as adminDashboardController from '../controllers/admin/AdminDashboardController.js';
import * as adminSystemController from '../controllers/admin/AdminSystemController.js';

import {
  listUsersSchema,
  getUserSchema,
  blockUserSchema,
  unblockUserSchema,
  changeRoleSchema,
} from '../validators/admin/adminUserValidator.js';

import {
  listUPISchema,
  getUPISchema,
  updateUPISchema,
  blacklistUPISchema,
  unblacklistUPISchema,
} from '../validators/admin/adminUPIValidator.js';

import { updateRiskConfigSchema } from '../validators/admin/adminConfigValidator.js';
import { listAuditLogsSchema, getAuditLogSchema } from '../validators/admin/adminAuditValidator.js';
import { adminLimiter } from '../middlewares/rateLimiter.js'; // Let's check if this exists

const router = Router();
const rateLimiter = adminLimiter;

router.use(authenticateFirebase);

// ============================================================================
// SYSTEM & DASHBOARD ROUTES
// ============================================================================

// MODERATOR AND ADMIN
router.get('/moderation/summary',
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  rateLimiter,
  adminDashboardController.getModerationSummary
);

// ADMIN ONLY
router.get('/dashboard/summary',
  authorizeRoles(ROLES.ADMIN),
  rateLimiter,
  adminDashboardController.getAdminSummary
);

router.get('/system/health',
  authorizeRoles(ROLES.ADMIN),
  rateLimiter,
  adminSystemController.getSystemHealth
);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

router.get('/users',
  authorizeRoles(ROLES.ADMIN),
  validate(listUsersSchema),
  adminUserController.listUsers
);

router.get('/users/:uid',
  authorizeRoles(ROLES.ADMIN),
  validate(getUserSchema),
  adminUserController.getUserDetails
);

router.patch('/users/:uid/block',
  authorizeRoles(ROLES.ADMIN),
  validate(blockUserSchema),
  adminUserController.blockUser
);

router.patch('/users/:uid/unblock',
  authorizeRoles(ROLES.ADMIN),
  validate(unblockUserSchema),
  adminUserController.unblockUser
);

router.patch('/users/:uid/role',
  authorizeRoles(ROLES.ADMIN),
  validate(changeRoleSchema),
  adminUserController.changeRole
);

// ============================================================================
// UPI INTELLIGENCE ROUTES
// ============================================================================

router.get('/upi',
  authorizeRoles(ROLES.ADMIN),
  validate(listUPISchema),
  adminUPIController.listUPIProfiles
);

router.get('/upi/:upiId',
  authorizeRoles(ROLES.ADMIN),
  validate(getUPISchema),
  adminUPIController.getUPIDetails
);

router.patch('/upi/:upiId',
  authorizeRoles(ROLES.ADMIN),
  validate(updateUPISchema),
  adminUPIController.updateUPI
);

router.post('/upi/:upiId/blacklist',
  authorizeRoles(ROLES.ADMIN),
  validate(blacklistUPISchema),
  adminUPIController.blacklistUPI
);

router.post('/upi/:upiId/unblacklist',
  authorizeRoles(ROLES.ADMIN),
  validate(unblacklistUPISchema),
  adminUPIController.unblacklistUPI
);

// ============================================================================
// CONFIGURATION ROUTES
// ============================================================================

router.get('/config',
  authorizeRoles(ROLES.ADMIN),
  adminConfigController.getConfig
);

router.patch('/config/risk',
  authorizeRoles(ROLES.ADMIN),
  validate(updateRiskConfigSchema),
  adminConfigController.updateRiskConfig
);

// ============================================================================
// AUDIT LOGS ROUTES
// ============================================================================

router.get('/audit-logs',
  authorizeRoles(ROLES.ADMIN),
  validate(listAuditLogsSchema),
  adminAuditController.listAuditLogs
);

router.get('/audit-logs/:id',
  authorizeRoles(ROLES.ADMIN),
  validate(getAuditLogSchema),
  adminAuditController.getAuditLogDetails
);

export default router;
