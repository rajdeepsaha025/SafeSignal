import adminUPIService from '../../services/admin/AdminUPIService.js';
import { HTTP_STATUS } from '../../config/constants.js';

export const listUPIProfiles = async (req, res, next) => {
  try {
    const result = await adminUPIService.listUPIProfiles(req.query);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getUPIDetails = async (req, res, next) => {
  try {
    const result = await adminUPIService.getUPIDetails(req.params.upiId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateUPI = async (req, res, next) => {
  try {
    await adminUPIService.updateUPI(req.params.upiId, req.body, req.user.uid);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: 'UPI profile updated successfully' } });
  } catch (error) {
    next(error);
  }
};

export const blacklistUPI = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await adminUPIService.blacklistUPI(req.params.upiId, reason, req.user.uid);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: 'UPI blacklisted successfully' } });
  } catch (error) {
    next(error);
  }
};

export const unblacklistUPI = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await adminUPIService.unblacklistUPI(req.params.upiId, reason, req.user.uid);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: 'UPI unblacklisted successfully' } });
  } catch (error) {
    next(error);
  }
};
