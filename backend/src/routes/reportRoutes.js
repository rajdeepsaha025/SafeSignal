/**
 * routes/reportRoutes.js
 * Community Reporting and Moderation routes.
 */

import { Router } from 'express';
import { submitReport, getMyReports, getReportById } from '../controllers/ReportController.js';
import { getPendingReports, approveReport, rejectReport } from '../controllers/ModerationController.js';
import { validate } from '../middlewares/validate.js';
import { submitReportSchema, getReportsSchema } from '../validators/reportValidator.js';
import { moderateReportSchema } from '../validators/moderationValidator.js';
import authenticateFirebase from '../middlewares/authenticate.js';
import authorizeRoles from '../middlewares/authorize.js';
import { ROLES } from '../config/constants.js';
import { strictRateLimiter, reportSubmissionLimiter, moderationLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.use(authenticateFirebase);

// --- Moderation Routes ---
router.get('/pending', 
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  validate(getReportsSchema),
  getPendingReports
);

router.patch('/:reportId/approve',
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  moderationLimiter,
  validate(moderateReportSchema),
  approveReport
);

router.patch('/:reportId/reject',
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  moderationLimiter,
  validate(moderateReportSchema),
  rejectReport
);

// --- User Reporting Routes ---
router.post('/',
  reportSubmissionLimiter,
  validate(submitReportSchema),
  submitReport
);

router.get('/my',
  strictRateLimiter,
  validate(getReportsSchema),
  getMyReports
);

router.get('/:reportId',
  strictRateLimiter,
  getReportById
);

export default router;
