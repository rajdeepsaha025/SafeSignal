/**
 * services/signals/VerifiedReportSignal.js
 * Calculates risk score based on the number of APPROVED reports.
 */

import { SIGNAL_WEIGHTS } from '../../config/riskConfig.js';
import { RISK_SIGNALS } from '../../constants/riskSignals.js';

export class VerifiedReportSignal {
  /**
   * @param {object} context
   * @param {number} context.approvedCount
   */
  evaluate({ approvedCount = 0 }) {
    let score = 0;
    
    if (approvedCount === 1 || approvedCount === 2) {
      score = SIGNAL_WEIGHTS.VERIFIED_REPORTS.BASE_WEIGHT;
    } else if (approvedCount >= 3 && approvedCount <= 5) {
      score = SIGNAL_WEIGHTS.VERIFIED_REPORTS.BASE_WEIGHT * 2; // Moderate
    } else if (approvedCount > 5) {
      score = SIGNAL_WEIGHTS.VERIFIED_REPORTS.BASE_WEIGHT * 3; // Strong
    }

    // Cap the score
    if (score > SIGNAL_WEIGHTS.VERIFIED_REPORTS.MAX_SCORE) {
      score = SIGNAL_WEIGHTS.VERIFIED_REPORTS.MAX_SCORE;
    }

    let severity = 'LOW';
    if (score > 15) severity = 'MEDIUM';
    if (score >= 40) severity = 'HIGH';

    return {
      name: RISK_SIGNALS.VERIFIED_REPORTS,
      score,
      severity,
      evidenceCount: approvedCount,
      description: `${approvedCount} approved community reports are associated with this UPI ID.`,
    };
  }
}
