import { z } from 'zod';
import { RISK_LEVELS } from '../../config/constants.js';

export const listUPISchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    riskLevel: z.enum([RISK_LEVELS.LOW, RISK_LEVELS.MEDIUM, RISK_LEVELS.HIGH, RISK_LEVELS.CRITICAL]).optional(),
    isBlacklisted: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    search: z.string().optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
  }),
});

export const getUPISchema = z.object({
  params: z.object({
    upiId: z.string().min(1, 'UPI ID is required'),
  }),
});

export const updateUPISchema = z.object({
  params: z.object({
    upiId: z.string().min(1, 'UPI ID is required'),
  }),
  body: z.object({
    administrativeNote: z.string().max(1000).optional().nullable(),
  }).strict(),
});

export const blacklistUPISchema = z.object({
  params: z.object({
    upiId: z.string().min(1, 'UPI ID is required'),
  }),
  body: z.object({
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  }),
});

export const unblacklistUPISchema = z.object({
  params: z.object({
    upiId: z.string().min(1, 'UPI ID is required'),
  }),
  body: z.object({
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  }),
});
