import adminSystemService from '../../services/admin/AdminSystemService.js';
import { HTTP_STATUS } from '../../config/constants.js';

export const getSystemHealth = async (req, res, next) => {
  try {
    const health = await adminSystemService.getSystemHealth();
    res.status(HTTP_STATUS.OK).json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
};
