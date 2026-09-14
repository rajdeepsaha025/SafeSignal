/**
 * errorHandler.js
 * Centralised Express error-handling middleware.
 *
 * Must be registered LAST in app.js (after all routes).
 * Handles both ApiError instances and unexpected native errors.
 *
 * Response shape:
 * {
 *   "success": false,
 *   "message": "...",
 *   "errors": [],
 *   "timestamp": "<ISO>"
 * }
 */

import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * @param {Error}                          err
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next   // must be declared even if unused
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message    = 'An unexpected error occurred';
  let errors     = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message    = err.message;
    errors     = err.errors;
  } else if (err.name === 'SyntaxError' && err.status === 400) {
    // Invalid JSON body
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message    = 'Invalid JSON in request body';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message    = 'Request body exceeds the allowed size limit';
  }

  // Log internal errors with stack traces
  if (statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${statusCode}`, {
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`);
  }

  const responseBody = {
    success:   false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };

  // Expose stack trace only in development
  if (env.isDev && err.stack && statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};

export default errorHandler;
