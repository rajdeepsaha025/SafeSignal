import { z } from 'zod';
import { ROLES, USER_STATUS } from '../../config/constants.js';

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    role: z.enum([ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN]).optional(),
    status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.BLOCKED]).optional(),
    search: z.string().optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
  }),
});

export const blockUserSchema = z.object({
  params: z.object({
    uid: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  }),
});

export const unblockUserSchema = z.object({
  params: z.object({
    uid: z.string().min(1, 'User ID is required'),
  }),
});

export const changeRoleSchema = z.object({
  params: z.object({
    uid: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    role: z.enum([ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN], {
      errorMap: () => ({ message: 'Invalid role' }),
    }),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    uid: z.string().min(1, 'User ID is required'),
  }),
});
