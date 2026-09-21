/**
 * validators/moderationValidator.js
 * Zod schemas for validating Moderation requests.
 */

import { z } from 'zod';

export const moderateReportSchema = z.object({
  params: z.object({
    reportId: z.string().min(5, 'Invalid report ID.')
  }),
  body: z.object({
    moderationReason: z.string()
      .trim()
      .min(10, 'Moderation reason must be at least 10 characters.')
      .max(500, 'Moderation reason too long.')
  })
});
