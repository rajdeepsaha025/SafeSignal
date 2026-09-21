/**
 * services/RiskExplanationService.js
 * Generates human-readable explanations based on the triggered signals and overall risk.
 */

import { RISK_LEVELS } from '../constants/riskLevels.js';

class RiskExplanationService {
  /**
   * Generates a high-level summary based on the risk level and signals.
   * @param {string} riskLevel 
   * @param {Array<object>} signals 
   * @param {boolean} isUnknown 
   */
  generateSummary(riskLevel, signals, isUnknown) {
    if (isUnknown) {
      return 'No significant SafeSignal risk signals were found.';
    }

    if (riskLevel === RISK_LEVELS.HIGH) {
      return 'Multiple significant risk signals were found. High probability of suspicious activity.';
    }

    if (riskLevel === RISK_LEVELS.MEDIUM) {
      return 'Some risk signals were found. Proceed with caution.';
    }

    return 'Risk signals indicate normal or low-risk activity.';
  }

  /**
   * Filters and maps signals to the 'reasons' array format expected by the API.
   * Only includes signals that actually contributed context or score.
   * @param {Array<object>} signals 
   */
  generateReasons(signals) {
    return signals
      .filter(signal => signal.severity !== 'NONE' && signal.description)
      .map(signal => {
        let title = signal.name.toLowerCase().replace(/_/g, ' ');
        title = title.charAt(0).toUpperCase() + title.slice(1);
        
        return {
          title,
          description: signal.description,
          severity: signal.severity
        };
      });
  }
}

export default new RiskExplanationService();
