/**
 * healthRoutes.js
 * Route definitions for the health check endpoint.
 *
 * GET /api/v1/health — public, rate limiter excluded
 */

import { Router } from 'express';
import healthCheck from '../controllers/healthController.js';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @access  Public
 * @desc    Returns service health status and Firebase connectivity
 */
router.get('/', healthCheck);

export default router;
