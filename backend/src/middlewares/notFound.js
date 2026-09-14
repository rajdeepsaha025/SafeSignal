/**
 * notFound.js
 * Catch-all middleware for unmatched routes.
 * Registered AFTER all routes but BEFORE the error handler.
 */

import { ApiError } from '../utils/ApiError.js';

/**
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFound;
