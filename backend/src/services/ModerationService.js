/**
 * services/ModerationService.js
 * Handles moderation logic (Approve/Reject) using Firestore transactions.
 */

import { firestore } from '../config/firebaseAdmin.js';
import reportRepository from '../repositories/ReportRepository.js';
import riskService from './RiskService.js';
import { COLLECTIONS, REPORT_STATUS } from '../config/constants.js';

class ModerationService {
  async getPendingReports(options) {
    return reportRepository.findPending(options);
  }

  async _verifyAndGetReport(transaction, reportId) {
    const reportRef = firestore.collection(COLLECTIONS.REPORTS).doc(reportId);
    const reportDoc = await transaction.get(reportRef);

    if (!reportDoc.exists) {
      const error = new Error('Report not found.');
      error.code = 'not-found/report';
      throw error;
    }

    const report = reportDoc.data();
    if (report.status !== REPORT_STATUS.PENDING) {
      const error = new Error('This report has already been moderated.');
      error.code = 'conflict/already-moderated';
      throw error;
    }

    return { reportRef, report };
  }

  async approveReport(reportId, moderationReason, moderator) {
    await firestore.runTransaction(async (transaction) => {
      const { reportRef, report } = await this._verifyAndGetReport(transaction, reportId);
      
      const upiRef = firestore.collection(COLLECTIONS.UPI_PROFILES).doc(report.upiId);
      const upiDoc = await transaction.get(upiRef);

      if (upiDoc.exists) {
        const upiData = upiDoc.data();
        const fraudCategories = new Set(upiData.fraudCategories || []);
        fraudCategories.add(report.fraudType);

        transaction.update(upiRef, {
          pendingReports: Math.max(0, (upiData.pendingReports || 0) - 1),
          verifiedReports: (upiData.verifiedReports || 0) + 1,
          fraudCategories: Array.from(fraudCategories),
          lastReported: new Date(),
          lastUpdated: new Date()
        });
      }

      transaction.update(reportRef, {
        status: REPORT_STATUS.APPROVED,
        moderatedBy: moderator.uid,
        moderationReason,
        moderatedAt: new Date(),
        updatedAt: new Date()
      });

      const auditRef = firestore.collection(COLLECTIONS.AUDIT_LOGS).doc();
      transaction.set(auditRef, {
        userId: moderator.uid,
        action: 'REPORT_APPROVED',
        resource: `reports/${reportId}`,
        timestamp: new Date()
      });
    });

    const report = await reportRepository.findById(reportId);
    riskService.invalidateCache(report.upiId);
    return report;
  }

  async rejectReport(reportId, moderationReason, moderator) {
    await firestore.runTransaction(async (transaction) => {
      const { reportRef, report } = await this._verifyAndGetReport(transaction, reportId);
      
      const upiRef = firestore.collection(COLLECTIONS.UPI_PROFILES).doc(report.upiId);
      const upiDoc = await transaction.get(upiRef);

      if (upiDoc.exists) {
        const upiData = upiDoc.data();
        transaction.update(upiRef, {
          pendingReports: Math.max(0, (upiData.pendingReports || 0) - 1),
          rejectedReports: (upiData.rejectedReports || 0) + 1,
          lastUpdated: new Date()
        });
      }

      transaction.update(reportRef, {
        status: REPORT_STATUS.REJECTED,
        moderatedBy: moderator.uid,
        moderationReason,
        moderatedAt: new Date(),
        updatedAt: new Date()
      });

      const auditRef = firestore.collection(COLLECTIONS.AUDIT_LOGS).doc();
      transaction.set(auditRef, {
        userId: moderator.uid,
        action: 'REPORT_REJECTED',
        resource: `reports/${reportId}`,
        timestamp: new Date()
      });
    });

    const report = await reportRepository.findById(reportId);
    riskService.invalidateCache(report.upiId);
    return report;
  }
}

export default new ModerationService();
