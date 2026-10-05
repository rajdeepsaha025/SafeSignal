import upiRepository from '../../repositories/UPIRepository.js';
import auditRepository from '../../repositories/AuditRepository.js';
import { ApiError } from '../../utils/ApiError.js';
import { HTTP_STATUS } from '../../config/constants.js';
import { offsetPaginate } from '../../utils/firestoreHelpers.js';

class AdminUPIService {
  async listUPIProfiles(queryParams) {
    const { page, limit, riskLevel, isBlacklisted, search, createdAfter, createdBefore } = queryParams;
    let query = upiRepository.collection();

    if (riskLevel) query = query.where('riskLevel', '==', riskLevel);
    if (isBlacklisted !== undefined) query = query.where('isBlacklisted', '==', isBlacklisted);
    if (createdAfter) query = query.where('createdAt', '>=', new Date(createdAfter));
    if (createdBefore) query = query.where('createdAt', '<=', new Date(createdBefore));
    
    if (search) {
      const normalizedSearch = search.toLowerCase().trim();
      const end = normalizedSearch + '\uf8ff';
      query = query.where('upiId', '>=', normalizedSearch).where('upiId', '<=', end).orderBy('upiId');
    } else {
      query = query.orderBy('lastUpdated', 'desc');
    }

    const { docs, ...meta } = await offsetPaginate(query, page, limit);
    const items = docs.map(d => d.data());

    // Remove reporter identities or any sensitive info if any exists, though UPI profiles usually don't have reporter identities directly (they are in reports).
    
    return { items, ...meta };
  }

  async getUPIDetails(upiId) {
    const normalizedUpiId = upiId.toLowerCase().trim();
    const profile = await upiRepository.findByUpiId(normalizedUpiId);
    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'UPI Profile not found');
    }
    return profile;
  }

  async updateUPI(upiId, updates, adminUid) {
    const normalizedUpiId = upiId.toLowerCase().trim();
    const profile = await upiRepository.findByUpiId(normalizedUpiId);
    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'UPI Profile not found');
    }

    const safeUpdates = {};
    if (updates.administrativeNote !== undefined) {
      safeUpdates.administrativeNote = updates.administrativeNote;
    }
    
    await upiRepository.update(normalizedUpiId, safeUpdates);

    await auditRepository.log({
      userId: adminUid,
      action: 'ADMIN_UPI_UPDATED',
      resource: normalizedUpiId,
      metadata: { safeUpdates }
    });
  }

  async blacklistUPI(upiId, reason, adminUid) {
    const normalizedUpiId = upiId.toLowerCase().trim();
    const profile = await upiRepository.findByUpiId(normalizedUpiId);
    
    // We can blacklist even if it doesn't strictly exist yet, 
    // but the spec suggests it should exist. Let's create it if it doesn't.
    if (!profile) {
       await upiRepository.upsert(normalizedUpiId, {
           isBlacklisted: true,
           blacklistedAt: new Date(),
           blacklistedBy: adminUid,
           blacklistReason: reason,
           riskScore: 100, // Blacklist max score
           riskLevel: 'CRITICAL',
           riskReasons: ['SafeSignal Blacklist'],
           createdAt: new Date()
       });
    } else {
        await upiRepository.update(normalizedUpiId, {
          isBlacklisted: true,
          blacklistedAt: new Date(),
          blacklistedBy: adminUid,
          blacklistReason: reason
        });
    }

    await auditRepository.log({
      userId: adminUid,
      action: 'UPI_BLACKLISTED',
      resource: normalizedUpiId,
      metadata: { reason }
    });

    // In a real scenario, invalidate cache here. 
    // e.g., cacheService.invalidateUpiCache(normalizedUpiId);
  }

  async unblacklistUPI(upiId, reason, adminUid) {
    const normalizedUpiId = upiId.toLowerCase().trim();
    const profile = await upiRepository.findByUpiId(normalizedUpiId);
    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'UPI Profile not found');
    }

    await upiRepository.update(normalizedUpiId, {
      isBlacklisted: false,
      unblacklistedAt: new Date(),
      unblacklistedBy: adminUid,
      unblacklistReason: reason
    });

    await auditRepository.log({
      userId: adminUid,
      action: 'UPI_UNBLACKLISTED',
      resource: normalizedUpiId,
      metadata: { reason }
    });

    // In a real scenario, invalidate cache here.
  }
}

export default new AdminUPIService();
