/**
 * routes/riskRoutes.js
 * Routes for the Rule-Based Risk Engine.
 */

import { Router } from 'express';
import authenticateFirebase from '../middlewares/authenticate.js';
import validate from '../middlewares/validate.js';
import { riskCheckLimiter } from '../middlewares/rateLimiter.js';
import { checkRiskScore } from '../controllers/RiskController.js';
import { riskCheckSchema } from '../validators/riskValidator.js';

const router = Router();

/**
 * @route   POST /api/v1/check/score
 * @access  Protected (any authenticated user)
 * @desc    Evaluates the risk of a given UPI ID using the Risk Engine.
 */
router.post(
  '/score',
  riskCheckLimiter,
  authenticateFirebase,
  validate(riskCheckSchema),
  checkRiskScore
);

export default router;
