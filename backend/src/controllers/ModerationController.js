/**
 * controllers/ModerationController.js
 * REST Handlers for Moderating Reports.
 */

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import moderationService from '../services/ModerationService.js';

export const getPendingReports = asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit, 10) || 20,
    startAfter: req.query.startAfter,
  };
  const reports = await moderationService.getPendingReports(options);
  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(reports, 'Fetched pending reports successfully.')
  );
});

export const approveReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { moderationReason } = req.body;
  const report = await moderationService.approveReport(reportId, moderationReason, req.user);
  
  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(report, 'Report approved successfully.')
  );
});

export const rejectReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { moderationReason } = req.body;
  const report = await moderationService.rejectReport(reportId, moderationReason, req.user);
  
  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(report, 'Report rejected successfully.')
  );
});
