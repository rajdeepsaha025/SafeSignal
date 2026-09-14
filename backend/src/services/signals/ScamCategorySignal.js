/**
 * services/signals/ScamCategorySignal.js
 * Identifies the most prominent fraud category from approved reports.
 */

import { RISK_SIGNALS } from '../../constants/riskSignals.js';

export class ScamCategorySignal {
  /**
   * @param {object} context
   * @param {Array<object>} context.approvedReports
   */
  evaluate({ approvedReports = [] }) {
    if (approvedReports.length === 0) {
      return { name: RISK_SIGNALS.SCAM_CATEGORY, score: 0, severity: 'NONE', evidenceCount: 0, description: '', categories: [] };
    }

    const categoriesCount = {};
    for (const report of approvedReports) {
      if (report.fraudType) {
        categoriesCount[report.fraudType] = (categoriesCount[report.fraudType] || 0) + 1;
      }
    }

    const sortedCategories = Object.entries(categoriesCount)
      .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0][0];
      const categoryName = topCategory.toLowerCase().replace('_', ' ');
      
      return {
        name: RISK_SIGNALS.SCAM_CATEGORY,
        score: 0, // Doesn't add numerical score, just context
        severity: 'MEDIUM',
        evidenceCount: sortedCategories[0][1],
        description: `Multiple approved reports classify this activity as a ${categoryName}.`,
        categories: sortedCategories.map(c => c[0])
      };
    }

    return { name: RISK_SIGNALS.SCAM_CATEGORY, score: 0, severity: 'NONE', evidenceCount: 0, description: '', categories: [] };
  }
}
