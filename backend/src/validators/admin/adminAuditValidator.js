import { z } from 'zod';

export const listAuditLogsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    action: z.string().optional(),
    actorUid: z.string().optional(),
    resourceType: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
});

export const getAuditLogSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Audit log ID is required')
  })
});
