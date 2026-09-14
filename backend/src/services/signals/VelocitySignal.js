/**
 * services/signals/VelocitySignal.js
 * Detects bursts in reporting activity.
 */

import { SIGNAL_WEIGHTS } from '../../config/riskConfig.js';
import { RISK_SIGNALS } from '../../constants/riskSignals.js';

export class VelocitySignal {
  /**
   * @param {object} context
   * @param {Array<object>} context.recentReports - Reports in the last 24/48 hours
   */
  evaluate({ recentReports = [] }) {
    // Check reports in the last X hours
    const cutoff = Date.now() - (SIGNAL_WEIGHTS.VELOCITY.TIMEFRAME_HOURS * 60 * 60 * 1000);
    const burstCount = recentReports.filter(r => {
      const dt = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return dt.getTime() >= cutoff;
    }).length;

    let score = 0;
    let severity = 'NONE';
    let description = '';
    let isMultiplier = false;

    if (burstCount >= SIGNAL_WEIGHTS.VELOCITY.BURST_THRESHOLD) {
      score = SIGNAL_WEIGHTS.VELOCITY.MULTIPLIER; // Engine uses this as multiplier
      severity = 'HIGH';
      description = `Reporting activity has increased significantly recently (${burstCount} reports in 24h).`;
      isMultiplier = true;
    } else if (burstCount > 0) {
      description = 'Normal reporting activity levels.';
    }

    return {
      name: RISK_SIGNALS.VELOCITY,
      score,
      severity,
      evidenceCount: burstCount,
      description,
      isMultiplier,
    };
  }
}
