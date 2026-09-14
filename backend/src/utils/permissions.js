/**
 * utils/permissions.js
 * Role and permission constants for SafeSignal RBAC.
 *
 * ROLES define who a user is.
 * PERMISSIONS define what actions are allowed.
 * ROLE_PERMISSIONS maps roles to their allowed permissions.
 *
 * Usage:
 *   import { PERMISSIONS, hasPermission } from '../utils/permissions.js';
 *   if (hasPermission(user.role, PERMISSIONS.APPROVE_REPORTS)) { ... }
 */

import { ROLES } from '../config/constants.js';

// ─── Permissions ───────────────────────────────────────────────────────────────

export const PERMISSIONS = {
  // UPI checks
  CHECK_UPI:            'check_upi',

  // Reports
  SUBMIT_REPORT:        'submit_report',
  VIEW_OWN_REPORTS:     'view_own_reports',
  VIEW_ALL_REPORTS:     'view_all_reports',
  APPROVE_REPORT:       'approve_report',
  REJECT_REPORT:        'reject_report',

  // History
  VIEW_OWN_HISTORY:     'view_own_history',
  VIEW_ALL_HISTORY:     'view_all_history',

  // Profile
  VIEW_OWN_PROFILE:     'view_own_profile',
  VIEW_ALL_PROFILES:    'view_all_profiles',

  // Community
  VIEW_COMMUNITY_STATS: 'view_community_stats',

  // Analytics
  VIEW_ANALYTICS:       'view_analytics',

  // Admin
  MANAGE_USERS:         'manage_users',
  MANAGE_MODERATORS:    'manage_moderators',
  MANAGE_CONFIG:        'manage_config',
  VIEW_AUDIT_LOGS:      'view_audit_logs',
};

// ─── Role → Permission Map ─────────────────────────────────────────────────────

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.CHECK_UPI,
    PERMISSIONS.SUBMIT_REPORT,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.VIEW_OWN_HISTORY,
    PERMISSIONS.VIEW_OWN_PROFILE,
  ],

  [ROLES.MODERATOR]: [
    PERMISSIONS.CHECK_UPI,
    PERMISSIONS.SUBMIT_REPORT,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.APPROVE_REPORT,
    PERMISSIONS.REJECT_REPORT,
    PERMISSIONS.VIEW_OWN_HISTORY,
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.VIEW_ALL_PROFILES,
    PERMISSIONS.VIEW_COMMUNITY_STATS,
  ],

  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admins have all permissions
};

// ─── Role Hierarchy ────────────────────────────────────────────────────────────

/** Numeric weight for role comparison. Higher = more privileged. */
export const ROLE_WEIGHT = {
  [ROLES.USER]:      1,
  [ROLES.MODERATOR]: 2,
  [ROLES.ADMIN]:     3,
};

/**
 * Returns true if the given role has the specified permission.
 * @param {string} role       - ROLES.*
 * @param {string} permission - PERMISSIONS.*
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Returns true if roleA is at least as privileged as roleB.
 * @param {string} roleA
 * @param {string} roleB
 * @returns {boolean}
 */
export function isAtLeast(roleA, roleB) {
  return (ROLE_WEIGHT[roleA] ?? 0) >= (ROLE_WEIGHT[roleB] ?? 0);
}

/**
 * Returns all permissions for a given role.
 * @param {string} role
 * @returns {string[]}
 */
export function getPermissions(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}
