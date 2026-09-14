/**
 * validators/authValidator.js
 * Zod schemas for authentication-related request validation.
 */

import { z } from 'zod';

// ─── Headers Schema ───────────────────────────────────────────────────────────

/**
 * Validates that the Authorization header is present and correctly formatted.
 * Used as a lightweight early check before token verification.
 */
export const authHeaderSchema = z.object({
  headers: z.object({
    authorization: z
      .string({ required_error: 'Authorization header is required' })
      .startsWith('Bearer ', 'Authorization header must start with "Bearer "')
      .min(10, 'Token is too short'),
  }).passthrough(),
}).passthrough();

// ─── Profile Update Schema ────────────────────────────────────────────────────

/**
 * Validates the body of a profile update request.
 * Only display name and photo URL are user-updatable.
 */
export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z
      .string()
      .min(1, 'Display name cannot be empty')
      .max(100, 'Display name is too long')
      .optional(),
    photoURL: z
      .string()
      .url('Photo URL must be a valid URL')
      .max(500)
      .optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field (displayName or photoURL) must be provided' }
  ),
}).passthrough();
