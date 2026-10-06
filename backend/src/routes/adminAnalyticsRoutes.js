import { Router } from 'express';
import AnalyticsController from '../controllers/admin/AnalyticsController.js';
import authenticateFirebase from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { getAnalyticsSchema } from '../validators/analyticsValidator.js';
import { ROLES } from '../config/constants.js';
import { adminLimiter } from '../middlewares/rateLimiter.js';

const router = Router();
router.use(authenticateFirebase);
router.use(adminLimiter);

// Only Admins for overview and users
router.get(
  '/overview',
  authorizeRoles(ROLES.ADMIN),
  AnalyticsController.getOverview
);

router.get(
  '/users',
  authorizeRoles(ROLES.ADMIN),
  validate(getAnalyticsSchema),
  AnalyticsController.getUsers
);

// Moderators and Admins for the rest
router.get(
  '/moderation',
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  validate(getAnalyticsSchema),
  AnalyticsController.getModeration
);

router.get(
  '/checks',
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  validate(getAnalyticsSchema),
  AnalyticsController.getChecks
);

router.get(
  '/risk',
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  validate(getAnalyticsSchema),
  AnalyticsController.getRisk
);

router.get(
  '/categories',
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  validate(getAnalyticsSchema),
  AnalyticsController.getCategories
);

export default router;
