import adminConfigService from '../../services/admin/AdminConfigService.js';
import { HTTP_STATUS } from '../../config/constants.js';

export const getConfig = async (req, res, next) => {
  try {
    const config = await adminConfigService.getConfig();
    res.status(HTTP_STATUS.OK).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

export const updateRiskConfig = async (req, res, next) => {
  try {
    const result = await adminConfigService.updateRiskConfig(req.body, req.user.uid);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
