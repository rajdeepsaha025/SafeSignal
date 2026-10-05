import auditRepository from '../../repositories/AuditRepository.js';
import { ApiError } from '../../utils/ApiError.js';
import { HTTP_STATUS } from '../../config/constants.js';
import { offsetPaginate } from '../../utils/firestoreHelpers.js';

class AdminAuditService {
  async listAuditLogs(queryParams) {
    const { page, limit, action, actorUid, resourceType, startDate, endDate } = queryParams;
    let query = auditRepository.collection();

    if (action) query = query.where('action', '==', action);
    if (actorUid) query = query.where('userId', '==', actorUid);
    if (resourceType) query = query.where('resourceType', '==', resourceType);
    
    if (startDate) query = query.where('timestamp', '>=', new Date(startDate));
    if (endDate) query = query.where('timestamp', '<=', new Date(endDate));

    query = query.orderBy('timestamp', 'desc');

    const { docs, ...meta } = await offsetPaginate(query, page, limit);
    const items = docs.map(d => ({ id: d.id, ...d.data() }));

    return { items, ...meta };
  }

  async getAuditLogDetails(id) {
    const log = await auditRepository.findById(id);
    if (!log) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Audit log not found');
    }
    return log;
  }
}

export default new AdminAuditService();
