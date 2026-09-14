/**
 * validators/index.js
 * Zod schema validators — barrel export.
 *
 * All request validation schemas are defined here (or in feature-specific files)
 * and used via the validate() middleware in routes.
 *
 * Convention:
 *   Each schema validates { body?, query?, params? } using z.object().
 *
 * Add exports here as validators are implemented:
 *   export * from './authValidator.js';
 *   export * from './reportValidator.js';
 *   export * from './riskValidator.js';
 */

import { z } from 'zod';

// ─── Shared schema primitives ─────────────────────────────────────────────────

/**
 * UPI ID format validator.
 * Standard UPI ID format: alphanumeric@bankhandle
 * e.g., user@okicici, 9876543210@paytm
 */
export const upiIdSchema = z
  .string()
  .min(3, 'UPI ID is too short')
  .max(100, 'UPI ID is too long')
  .regex(
    /^[a-zA-Z0-9.\-_+]+@[a-zA-Z0-9]+$/,
    'Invalid UPI ID format. Expected format: handle@bank'
  );

/**
 * Pagination query schema.
 */
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Placeholder — feature-specific validators to be added.
