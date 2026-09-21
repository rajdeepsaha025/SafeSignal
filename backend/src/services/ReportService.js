/**
 * services/ReportService.js
 * Handles community fraud reporting submissions and user queries.
 */

import { firestore } from '../config/firebaseAdmin.js';
import reportRepository from '../repositories/ReportRepository.js';
import { COLLECTIONS, REPORT_STATUS, RISK_LEVELS } from '../config/constants.js';

class ReportService {
  normalizeUpiId(upiId) {
    return upiId.trim().toLowerCase();
  }

  async checkDuplicateReport(upiId, uid) {
    const hasReported = await reportRepository.hasUserReported(upiId, uid);
    if (hasReported) {
      const error = new Error('You have already submitted a similar report recently.');
      error.code = 'conflict/duplicate-report';
      throw error;
    }
  }

  async submitReport(data, user) {
    const upiId = this.normalizeUpiId(data.upiId);
    await this.checkDuplicateReport(upiId, user.uid);

    return firestore.runTransaction(async (transaction) => {
      const upiRef = firestore.collection(COLLECTIONS.UPI_PROFILES).doc(upiId);
      const upiDoc = await transaction.get(upiRef);

      if (!upiDoc.exists) {
        transaction.set(upiRef, {
          upiId,
          riskScore: 0,
          riskLevel: RISK_LEVELS.LOW,
          verifiedReports: 0,
          pendingReports: 1,
          rejectedReports: 0,
          totalChecks: 0,
          fraudCategories: [],
          riskReasons: [],
          isBlacklisted: false,
          lastUpdated: new Date()
        });
      } else {
        const data = upiDoc.data();
        transaction.update(upiRef, {
          pendingReports: (data.pendingReports || 0) + 1,
          lastUpdated: new Date()
        });
      }

      const reportRef = firestore.collection(COLLECTIONS.REPORTS).doc();
      const reportData = {
        upiId,
        reporterUid: user.uid,
        fraudType: data.fraudType,
        description: data.description,
        evidenceUrls: data.evidenceUrls || [],
        status: REPORT_STATUS.PENDING,
        reporterReputation: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      transaction.set(reportRef, reportData);

      const auditRef = firestore.collection(COLLECTIONS.AUDIT_LOGS).doc();
      transaction.set(auditRef, {
        userId: user.uid,
        action: 'REPORT_SUBMITTED',
        resource: `reports/${reportRef.id}`,
        timestamp: new Date()
      });

      return { id: reportRef.id, ...reportData };
    });
  }

  async getMyReports(uid, options) {
    return reportRepository.findByReporter(uid, options);
  }

  async getReportById(reportId, user) {
    const report = await reportRepository.findById(reportId);
    if (!report) {
      const error = new Error('Report not found.');
      error.code = 'not-found/report';
      throw error;
    }

    if (user.role === 'USER' && report.reporterUid !== user.uid) {
      const error = new Error('You do not have permission to view this report.');
      error.code = 'forbidden/unauthorized-access';
      throw error;
    }

    return report;
  }
}

export default new ReportService();
