/**
 * rateLimiter.js
 * Global rate limiter middleware using express-rate-limit.
 *
 * Global: 100 requests per 15 minutes per IP.
 * The /api/v1/health endpoint bypasses this limiter (skip function).
 */

import rateLimit from 'express-rate-limit';
import { RATE_LIMIT, HTTP_STATUS } from '../config/constants.js';

/**
 * Global rate limiter — applied to all routes except health check.
 */
export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max:      RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,   // Returns rate limit info in the `RateLimit-*` headers
  legacyHeaders:   false,  // Disables the `X-RateLimit-*` headers

  /**
   * Skip the rate limiter for the health check endpoint.
   * @param {import('express').Request} req
   * @returns {boolean}
   */
  skip: (req) => req.path === '/api/v1/health' || req.path === '/health',

  /**
   * Custom JSON response when limit is exceeded.
   */
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success:   false,
      message:   'Too many requests. Please try again later.',
      errors:    [],
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Stricter limiter — apply on sensitive endpoints (e.g., auth, report submission).
 * 20 requests per 15 minutes.
 */
export const strictRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,

  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success:   false,
      message:   'Rate limit exceeded on this endpoint. Please slow down.',
      errors:    [],
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Limiter for UPI Risk Checks.
 * 30 requests per 15 minutes.
 * Can be keyed by user ID later if needed (keyGenerator).
 */
export const riskCheckLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max:      30, // 30 checks per user per 15 minutes
  standardHeaders: true,
  legacyHeaders:   false,

  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success:   false,
      message:   'You have exceeded the maximum number of risk checks allowed. Please try again later.',
      errors:    [],
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Limiter for Community Report submissions.
 * 5 requests per hour.
 */
export const reportSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'You have exceeded the maximum number of report submissions allowed per hour. Please try again later.',
      errors: [],
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Limiter for moderation actions.
 * 50 requests per 15 minutes.
 */
export const moderationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Moderation rate limit exceeded. Please slow down.',
      errors: [],
      timestamp: new Date().toISOString(),
    });
  },
});
