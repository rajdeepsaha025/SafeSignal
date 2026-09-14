/**
 * types/index.js
 * JSDoc type definitions for the SafeSignal backend.
 *
 * These are documentation-only types using JSDoc notation (no TypeScript).
 * Import them in JSDoc @param / @returns tags for IDE intellisense.
 *
 * Add definitions as features are built.
 */

/**
 * @typedef {Object} AuthenticatedUser
 * @property {string} uid         - Firebase UID
 * @property {string} email       - User email
 * @property {string} [role]      - Custom claim: 'user' | 'moderator' | 'admin'
 * @property {boolean} email_verified
 */

/**
 * @typedef {Object} UpiReport
 * @property {string}  id          - Firestore document ID (UUID)
 * @property {string}  upiId       - Reported UPI ID
 * @property {string}  reportedBy  - Firebase UID of the reporter
 * @property {string}  category    - Fraud category (e.g., 'phishing', 'fake_merchant')
 * @property {string}  description - Freeform description
 * @property {string}  status      - 'pending' | 'verified' | 'rejected' | 'escalated'
 * @property {string}  createdAt   - ISO 8601 timestamp
 * @property {string}  updatedAt   - ISO 8601 timestamp
 */

/**
 * @typedef {Object} RiskScore
 * @property {string}  upiId        - The scored UPI ID
 * @property {number}  score        - 0–100 risk score
 * @property {string}  tier         - 'safe' | 'low' | 'medium' | 'high' | 'critical'
 * @property {string}  computedAt   - ISO 8601 timestamp
 * @property {Object}  breakdown    - Score breakdown by signal type
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} page       - Current page number
 * @property {number} limit      - Items per page
 * @property {number} total      - Total item count
 * @property {number} totalPages - Total page count
 */

export {};
