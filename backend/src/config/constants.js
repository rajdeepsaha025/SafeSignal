/**
 * constants.js
 * Application-wide constants for SafeSignal backend.
 * No magic strings — always import from here.
 */

// ─── API ───────────────────────────────────────────────────────────────────────
export const API_PREFIX = '/api/v1';
export const API_VERSION = '1.0.0';
export const SERVICE_NAME = 'SafeSignal Backend';

// ─── HTTP Status Codes ─────────────────────────────────────────────────────────
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
};

// ─── Request ───────────────────────────────────────────────────────────────────
export const REQUEST = {
  MAX_BODY_SIZE: '10mb',
};

// ─── Firestore Collections ─────────────────────────────────────────────────────
// Single source of truth for all collection names. Never hardcode elsewhere.
export const COLLECTIONS = {
  USERS: 'users',
  UPI_PROFILES: 'upi_profiles',
  REPORTS: 'reports',
  CHECK_HISTORY: 'check_history',
  ANALYTICS: 'analytics',
  DEVICE_REPUTATION: 'device_reputation',
  ML_METADATA: 'ml_metadata',
  SYSTEM_CONFIG: 'system_config',
  AUDIT_LOGS: 'audit_logs',
};

// ─── User Roles ────────────────────────────────────────────────────────────────
export const ROLES = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
};

// ─── User Status ───────────────────────────────────────────────────────────────
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
};

// ─── Risk Levels ───────────────────────────────────────────────────────────────
export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

// ─── Report Status ─────────────────────────────────────────────────────────────
export const REPORT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// ─── Fraud Types ───────────────────────────────────────────────────────────────
export const FRAUD_TYPES = {
  INVESTMENT_SCAM: 'investment_scam',
  MARKETPLACE_SCAM: 'marketplace_scam',
  REFUND_SCAM: 'refund_scam',
  QR_SCAM: 'qr_scam',
  JOB_SCAM: 'job_scam',
  LOTTERY_SCAM: 'lottery_scam',
  DIGITAL_ARREST: 'digital_arrest',
  PHISHING: 'phishing',
  IMPERSONATION: 'impersonation',
  OTHER: 'other',
};

// ─── Check Sources ─────────────────────────────────────────────────────────────
export const CHECK_SOURCES = {
  WEB: 'WEB',
  ANDROID: 'ANDROID',
  EXTENSION: 'EXTENSION',
  API: 'API',
};

// ─── Pagination ────────────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// ─── Batch Sizes ───────────────────────────────────────────────────────────────
export const BATCH = {
  MAX_WRITE_SIZE: 500, // Firestore limit
  SEED_CHUNK_SIZE: 400, // Keep below Firestore limit for safety
};

// ─── UPI ID Providers ─────────────────────────────────────────────────────────
export const UPI_HANDLES = [
  'oksbi', 'okaxis', 'okicici', 'okhdfcbank',
  'paytm', 'ybl', 'ibl', 'axl',
  'upi', 'apl', 'waicici', 'pingpay',
  'ikwik', 'naviaxis', 'naviicici',
  'gpay', 'razorpay', 'airtelpaymentsbank',
];
