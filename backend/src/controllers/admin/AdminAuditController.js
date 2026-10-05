import adminAuditService from '../../services/admin/AdminAuditService.js';
import { HTTP_STATUS } from '../../config/constants.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const result = await adminAuditService.listAuditLogs(req.query);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogDetails = async (req, res, next) => {
  try {
    const result = await adminAuditService.getAuditLogDetails(req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
