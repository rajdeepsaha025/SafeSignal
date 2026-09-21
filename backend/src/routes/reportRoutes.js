/**
 * routes/reportRoutes.js
 * Community Reporting and Moderation routes.
 */

import { Router } from 'express';
import { submitReport, getMyReports, getReportById } from '../controllers/ReportController.js';
import { getPendingReports, approveReport, rejectReport } from '../controllers/ModerationController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { submitReportSchema, getReportsSchema } from '../validators/reportValidator.js';
import { moderateReportSchema } from '../validators/moderationValidator.js';
import { authenticateFirebase } from '../middlewares/authenticateFirebase.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { ROLES } from '../config/constants.js';
import { strictRateLimiter, reportSubmissionLimiter, moderationLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.use(authenticateFirebase);

// --- Moderation Routes ---
router.get('/pending', 
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  validateRequest(getReportsSchema),
  getPendingReports
);

router.patch('/:reportId/approve',
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  moderationLimiter,
  validateRequest(moderateReportSchema),
  approveReport
);

router.patch('/:reportId/reject',
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  moderationLimiter,
  validateRequest(moderateReportSchema),
  rejectReport
);

// --- User Reporting Routes ---
router.post('/',
  reportSubmissionLimiter,
  validateRequest(submitReportSchema),
  submitReport
);

router.get('/my',
  strictRateLimiter,
  validateRequest(getReportsSchema),
  getMyReports
);

router.get('/:reportId',
  strictRateLimiter,
  getReportById
);

export default router;
