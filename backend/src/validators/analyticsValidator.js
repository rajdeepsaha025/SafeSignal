import { z } from 'zod';

export const getAnalyticsSchema = z.object({
  query: z.object({
    range: z.enum(['today', '7d', '30d']).optional().default('7d')
  })
});
