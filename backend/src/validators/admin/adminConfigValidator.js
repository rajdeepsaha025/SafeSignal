import { z } from 'zod';

export const updateRiskConfigSchema = z.object({
  body: z.object({
    lowThreshold: z.number().min(0).max(100).optional(),
    mediumThreshold: z.number().min(0).max(100).optional(),
    weights: z.record(z.string(), z.number().min(0)).optional(),
    recency: z.record(z.string(), z.any()).optional(),
    velocity: z.record(z.string(), z.any()).optional(),
    confidence: z.record(z.string(), z.any()).optional(),
  }).strict().refine(data => {
    if (data.lowThreshold !== undefined && data.mediumThreshold !== undefined) {
      return data.lowThreshold < data.mediumThreshold;
    }
    return true;
  }, {
    message: 'lowThreshold must be less than mediumThreshold',
    path: ['lowThreshold']
  })
});
