import AnalyticsService from '../../services/analytics/AnalyticsService.js';
import { HTTP_STATUS } from '../../config/constants.js';

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const data = await AnalyticsService.getOverview();
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getChecks(req, res, next) {
    try {
      const { range } = req.query;
      const data = await AnalyticsService.getCheckAnalytics(range);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getRisk(req, res, next) {
    try {
      const { range } = req.query;
      const data = await AnalyticsService.getRiskAnalytics(range);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const { range } = req.query;
      const data = await AnalyticsService.getCategoryAnalytics(range);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getModeration(req, res, next) {
    try {
      const { range } = req.query;
      const data = await AnalyticsService.getModerationAnalytics(range);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const { range } = req.query;
      const data = await AnalyticsService.getUserAnalytics(range);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
