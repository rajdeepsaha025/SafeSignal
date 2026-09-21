/**
 * services/signals/BlacklistSignal.js
 * Applies maximum risk if the profile is explicitly blacklisted.
 */

import { SIGNAL_WEIGHTS } from '../../config/riskConfig.js';
import { RISK_SIGNALS } from '../../constants/riskSignals.js';

export class BlacklistSignal {
  /**
   * @param {object} context
   * @param {boolean} context.isBlacklisted
   */
  evaluate({ isBlacklisted = false }) {
    if (isBlacklisted) {
      return {
        name: RISK_SIGNALS.BLACKLIST,
        score: SIGNAL_WEIGHTS.BLACKLIST.SCORE, // Override score
        severity: 'HIGH',
        evidenceCount: 1,
        description: 'UPI ID is currently listed as blacklisted in SafeSignal intelligence.',
      };
    }
    return { name: RISK_SIGNALS.BLACKLIST, score: 0, severity: 'NONE', evidenceCount: 0, description: '' };
  }
}
