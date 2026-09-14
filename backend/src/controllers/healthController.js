/**
 * healthController.js
 * Controller for the health check endpoint.
 *
 * GET /api/v1/health
 *
 * Returns 200 if the service and Firebase are operational.
 * Returns 500 if Firebase failed to initialise.
 */

import { isFirebaseReady } from '../config/firebaseAdmin.js';
import { HTTP_STATUS, API_VERSION, SERVICE_NAME } from '../config/constants.js';

/**
 * Health check controller.
 * Intentionally does NOT use asyncHandler — this is a synchronous response.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const healthCheck = (req, res) => {
  if (!isFirebaseReady) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success:   false,
      service:   SERVICE_NAME,
      version:   API_VERSION,
      status:    'degraded',
      timestamp: new Date().toISOString(),
      firebase:  'disconnected',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success:   true,
    service:   SERVICE_NAME,
    version:   API_VERSION,
    status:    'healthy',
    timestamp: new Date().toISOString(),
    firebase:  'connected',
  });
};

export default healthCheck;
