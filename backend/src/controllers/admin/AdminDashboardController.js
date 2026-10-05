import adminDashboardService from '../../services/admin/AdminDashboardService.js';
import { HTTP_STATUS } from '../../config/constants.js';

export const getModerationSummary = async (req, res, next) => {
  try {
    const summary = await adminDashboardService.getModerationSummary();
    res.status(HTTP_STATUS.OK).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

export const getAdminSummary = async (req, res, next) => {
  try {
    const summary = await adminDashboardService.getAdminSummary();
    res.status(HTTP_STATUS.OK).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};
