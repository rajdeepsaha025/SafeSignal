/**
 * services/signals/CommunitySignal.js
 * Evaluates risk based on pending reports. Rejected reports do not increase risk.
 */

import { SIGNAL_WEIGHTS } from '../../config/riskConfig.js';
import { RISK_SIGNALS } from '../../constants/riskSignals.js';

export class CommunitySignal {
  /**
   * @param {object} context
   * @param {number} context.pendingCount
   * @param {number} context.rejectedCount
   */
  evaluate({ pendingCount = 0, _rejectedCount = 0 }) {
    // Rejected reports do NOT increase risk.
    let score = pendingCount * SIGNAL_WEIGHTS.PENDING_REPORTS.BASE_WEIGHT;

    if (score > SIGNAL_WEIGHTS.PENDING_REPORTS.MAX_SCORE) {
      score = SIGNAL_WEIGHTS.PENDING_REPORTS.MAX_SCORE;
    }

    const severity = score > 0 ? 'LOW' : 'NONE';

    return {
      name: RISK_SIGNALS.PENDING_REPORTS,
      score,
      severity,
      evidenceCount: pendingCount,
      description: `${pendingCount} pending community reports are associated with this UPI ID.`,
    };
  }
}
