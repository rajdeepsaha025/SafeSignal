/**
 * controllers/ReportController.js
 * REST Handlers for Community Reporting.
 */

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import reportService from '../services/ReportService.js';

export const submitReport = asyncHandler(async (req, res) => {
  const report = await reportService.submitReport(req.body, req.user);
  return res.status(HTTP_STATUS.CREATED).json(
    ApiResponse.success(report, 'Report submitted successfully.')
  );
});

export const getMyReports = asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit, 10) || 20,
    startAfter: req.query.startAfter,
  };
  const reports = await reportService.getMyReports(req.user.uid, options);
  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(reports, 'Fetched your reports successfully.')
  );
});

export const getReportById = asyncHandler(async (req, res) => {
  const report = await reportService.getReportById(req.params.reportId, req.user);
  return res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(report, 'Report fetched successfully.')
  );
});
