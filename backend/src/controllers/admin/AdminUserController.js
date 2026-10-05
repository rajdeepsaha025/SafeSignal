import adminUserService from '../../services/admin/AdminUserService.js';
import { HTTP_STATUS } from '../../config/constants.js';

export const listUsers = async (req, res, next) => {
  try {
    const result = await adminUserService.listUsers(req.query);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const result = await adminUserService.getUserDetails(req.params.uid);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await adminUserService.blockUser(req.params.uid, reason, req.user.uid);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: 'User blocked successfully' } });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    await adminUserService.unblockUser(req.params.uid, req.user.uid);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: 'User unblocked successfully' } });
  } catch (error) {
    next(error);
  }
};

export const changeRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    await adminUserService.changeRole(req.params.uid, role, req.user.uid);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { message: 'Role changed successfully' } });
  } catch (error) {
    next(error);
  }
};
