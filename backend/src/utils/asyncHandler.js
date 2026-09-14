/**
 * asyncHandler.js
 * Wraps an async Express route handler and forwards any rejected promise
 * to the next() error middleware — eliminates try/catch boilerplate.
 *
 * Usage:
 *   router.get('/resource', asyncHandler(async (req, res) => {
 *     const data = await someService.getData();
 *     res.json(ApiResponse.success(data));
 *   }));
 */

/**
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<void>} fn
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
