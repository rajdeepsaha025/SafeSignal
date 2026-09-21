/**
 * validators/reportValidator.js
 * Zod schemas for validating Community Reporting requests.
 */

import { z } from 'zod';
import { FRAUD_TYPES, REPORT_STATUS } from '../config/constants.js';

export const submitReportSchema = z.object({
  body: z.object({
    upiId: z.string()
      .trim()
      .min(5, 'UPI ID is too short.')
      .max(100, 'UPI ID is too long.')
      .regex(/^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/, 'Please enter a valid UPI ID.'),
    fraudType: z.enum(Object.values(FRAUD_TYPES), {
      errorMap: () => ({ message: 'Invalid fraud type provided.' })
    }),
    description: z.string()
      .trim()
      .min(20, 'Description must be at least 20 characters long.')
      .max(1000, 'Description too long.'),
    evidenceUrls: z.array(z.string().url('Invalid evidence URL.'))
      .max(3, 'Maximum 3 evidence files allowed.')
      .optional()
  })
});

export const getReportsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(50).optional().default(20),
    status: z.enum(Object.values(REPORT_STATUS)).optional(),
    fraudType: z.enum(Object.values(FRAUD_TYPES)).optional(),
    startAfter: z.string().optional()
  })
});
