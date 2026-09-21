/**
 * services/signals/RecencySignal.js
 * Adjusts risk based on how recently reports were filed.
 */

import { SIGNAL_WEIGHTS } from '../../config/riskConfig.js';
import { RISK_SIGNALS } from '../../constants/riskSignals.js';

export class RecencySignal {
  /**
   * @param {object} context
   * @param {Array<object>} context.approvedReports - Array of approved reports
   */
  evaluate({ approvedReports = [] }) {
    if (approvedReports.length === 0) {
      return { name: RISK_SIGNALS.RECENCY, score: 0, severity: 'NONE', evidenceCount: 0, description: '' };
    }

    // Find the most recent report
    const latestDate = Math.max(...approvedReports.map(r => {
      const dt = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return dt.getTime();
    }));
    
    const hoursSinceLastReport = (Date.now() - latestDate) / (1000 * 60 * 60);

    let multiplier = SIGNAL_WEIGHTS.RECENCY.OLDER_MULTIPLIER;
    let description = 'Most reports are older than 30 days.';

    if (hoursSinceLastReport <= 24) {
      multiplier = SIGNAL_WEIGHTS.RECENCY.LAST_24_HOURS_MULTIPLIER;
      description = 'Recent approved reports were submitted within the last 24 hours.';
    } else if (hoursSinceLastReport <= 24 * 7) {
      multiplier = SIGNAL_WEIGHTS.RECENCY.LAST_7_DAYS_MULTIPLIER;
      description = 'Approved reports were submitted within the last 7 days.';
    } else if (hoursSinceLastReport <= 24 * 30) {
      multiplier = SIGNAL_WEIGHTS.RECENCY.LAST_30_DAYS_MULTIPLIER;
      description = 'Approved reports were submitted within the last 30 days.';
    }

    // The score here could be implemented as a bonus to the final score, or as a multiplier.
    // For MVP, we will return the multiplier. The RiskEngineService will apply it to the base report score.
    return {
      name: RISK_SIGNALS.RECENCY,
      score: multiplier, // We pass multiplier here, Engine handles it
      severity: hoursSinceLastReport <= 24 * 7 ? 'HIGH' : 'LOW',
      evidenceCount: approvedReports.length,
      description,
      isMultiplier: true,
    };
  }
}
