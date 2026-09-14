/**
 * controllers/RiskController.js
 * HTTP request handlers for Risk Engine endpoints.
 */

import riskService from '../services/RiskService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, CHECK_SOURCES } from '../config/constants.js';

export const checkRiskScore = asyncHandler(async (req, res) => {
  const { upiId } = req.body;
  const user = req.user; // Set by authenticateFirebase
  
  // Default source to API for now, could be dynamic based on headers
  const source = CHECK_SOURCES.API;

  const riskResult = await riskService.checkRisk(upiId, user, source);

  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(
      riskResult,
      'Risk assessment completed successfully.'
    )
  );
});
