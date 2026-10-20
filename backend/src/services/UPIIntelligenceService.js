/**
 * services/UPIIntelligenceService.js
 * Responsible for gathering all necessary data by calling UPIRepository, ReportRepository, etc.
 */

import upiRepository from '../repositories/UPIRepository.js';
import reportRepository from '../repositories/ReportRepository.js';
import { REPORT_STATUS } from '../config/constants.js';

class UPIIntelligenceService {
  /**
   * Gathers all intelligence available for a given normalized UPI ID.
   * @param {string} upiId
   * @returns {Promise<object>}
   */
  async gatherIntelligence(upiId) {
    // We run queries concurrently
    const [profile, reportsResult] = await Promise.all([
      upiRepository.findByUpiId(upiId),
      reportRepository.findByUpiId(upiId, { limit: 100 }) // Load up to 100 most recent reports for evaluation
    ]);

    const reports = reportsResult?.items || [];
    const pendingCount = reports.length > 0
      ? reports.filter(r => r.status === REPORT_STATUS.PENDING).length
      : (profile?.pendingReports || 0);
    const approvedCount = reports.length > 0
      ? reports.filter(r => r.status === REPORT_STATUS.APPROVED).length
      : (profile?.verifiedReports || 0);
    const rejectedCount = reports.length > 0
      ? reports.filter(r => r.status === REPORT_STATUS.REJECTED).length
      : (profile?.rejectedReports || 0);

    const approvedReports = reports.filter(r => r.status === REPORT_STATUS.APPROVED);
    
    // Recent reports in last 24h/48h for velocity
    const cutoff = Date.now() - (48 * 60 * 60 * 1000);
    const recentReports = reports.filter(r => {
      const dt = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return dt.getTime() >= cutoff;
    });

    return {
      isUnknown: !profile && reports.length === 0,
      profile: profile || null,
      isBlacklisted: profile?.isBlacklisted || false,
      reportStats: {
        total: reports.length > 0 ? reports.length : (approvedCount + pendingCount + rejectedCount),
        pendingCount,
        approvedCount,
        rejectedCount
      },
      approvedReports,
      recentReports
    };
  }
}

export default new UPIIntelligenceService();
