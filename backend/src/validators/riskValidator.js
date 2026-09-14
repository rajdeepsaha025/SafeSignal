/**
 * validators/riskValidator.js
 * Zod schema for validating Risk Engine requests.
 */

import { z } from 'zod';

export const riskCheckSchema = z.object({
  body: z.object({
    upiId: z.string()
      .trim()
      .min(5, 'UPI ID is too short')
      .max(100, 'UPI ID is too long')
      .regex(/^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/, 'Please enter a valid UPI ID.')
  })
});
