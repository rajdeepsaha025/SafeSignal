/**
 * ApiError.js
 * Custom application error class that extends the native Error.
 *
 * Usage:
 *   throw new ApiError(404, 'User not found');
 *   throw new ApiError(422, 'Validation failed', [{ field: 'email', message: 'Invalid' }]);
 */

import { HTTP_STATUS } from '../config/constants.js';

export class ApiError extends Error {
  /**
   * @param {number}   statusCode  - HTTP status code
   * @param {string}   message     - Human-readable error message
   * @param {Array}    [errors]    - Optional array of field-level or detailed errors
   * @param {string}   [stack]     - Override stack trace (rarely needed)
   */
  constructor(
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message = 'An unexpected error occurred',
    errors = [],
    stack = ''
  ) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ─── Factory helpers ──────────────────────────────────────────────────────────

  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  static validationError(message = 'Validation failed', errors = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
  }
}
