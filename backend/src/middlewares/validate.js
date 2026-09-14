/**
 * validate.js
 * Zod-based request validation middleware factory.
 *
 * Usage:
 *   import { validate } from '../middlewares/validate.js';
 *   import { createReportSchema } from '../validators/reportValidator.js';
 *
 *   router.post('/reports', authenticate, validate(createReportSchema), asyncHandler(handler));
 *
 * The schema should be a Zod object shape for { body?, query?, params? }.
 *
 * On failure, throws ApiError.validationError with field-level details.
 */

import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/**
 * Formats Zod validation issues into a flat array of error objects.
 * @param {import('zod').ZodIssue[]} issues
 * @returns {{ field: string; message: string }[]}
 */
function formatZodErrors(issues) {
  return issues.map((issue) => ({
    field:   issue.path.join('.') || 'unknown',
    message: issue.message,
  }));
}

/**
 * Returns a middleware that validates req.body, req.query, and/or req.params
 * against the provided Zod schema.
 *
 * @param {import('zod').ZodObject<any>} schema
 * @returns {import('express').RequestHandler}
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body:   req.body,
      query:  req.query,
      params: req.params,
    });

    // Attach parsed (coerced) values back to the request
    req.body   = parsed.body   ?? req.body;
    req.query  = parsed.query  ?? req.query;
    req.params = parsed.params ?? req.params;

    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(ApiError.validationError('Validation failed', formatZodErrors(err.issues)));
    } else {
      next(err);
    }
  }
};
