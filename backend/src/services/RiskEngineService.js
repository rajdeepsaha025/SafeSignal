/**
 * services/RiskEngineService.js
 * The core deterministic Rule-Based Risk Engine.
 * Calculates risk scores based on aggregated intelligence and signals.
 */

import { RISK_THRESHOLDS, CONFIDENCE_LEVELS } from '../config/riskConfig.js';
import { RISK_LEVELS } from '../constants/riskLevels.js';
import { RISK_SIGNALS } from '../constants/riskSignals.js';

// Signal Evaluators
import { VerifiedReportSignal } from './signals/VerifiedReportSignal.js';
import { CommunitySignal } from './signals/CommunitySignal.js';
import { RecencySignal } from './signals/RecencySignal.js';
import { VelocitySignal } from './signals/VelocitySignal.js';
import { BlacklistSignal } from './signals/BlacklistSignal.js';
import { ScamCategorySignal } from './signals/ScamCategorySignal.js';

class RiskEngineService {
  constructor() {
    this.evaluators = [
      new BlacklistSignal(),
      new VerifiedReportSignal(),
      new CommunitySignal(),
      new RecencySignal(),
      new VelocitySignal(),
      new ScamCategorySignal()
    ];
  }

  /**
   * Main evaluation function.
   * @param {object} intelligence - Data gathered by UPIIntelligenceService
   */
  evaluate(intelligence) {
    if (intelligence.isUnknown) {
      return {
        score: 0,
        riskLevel: RISK_LEVELS.LOW,
        confidenceLevel: CONFIDENCE_LEVELS.LOW,
        signals: [],
        fraudCategories: []
      };
    }

    const context = {
      isBlacklisted: intelligence.isBlacklisted,
      approvedCount: intelligence.reportStats.approvedCount,
      pendingCount: intelligence.reportStats.pendingCount,
      rejectedCount: intelligence.reportStats.rejectedCount,
      approvedReports: intelligence.approvedReports,
      recentReports: intelligence.recentReports,
    };

    const signals = this.evaluators.map(evaluator => evaluator.evaluate(context));

    let finalScore = this._calculateFinalScore(signals);
    const riskLevel = this._determineRiskLevel(finalScore);
    const confidenceLevel = this._determineConfidence(context, finalScore);
    
    // Extract fraud categories
    const scamSignal = signals.find(s => s.name === RISK_SIGNALS.SCAM_CATEGORY);
    const fraudCategories = scamSignal && scamSignal.categories ? scamSignal.categories : [];

    return {
      score: finalScore,
      riskLevel,
      confidenceLevel,
      signals,
      fraudCategories
    };
  }

  /**
   * Aggregates base scores and applies multipliers. Caps at 100.
   */
  _calculateFinalScore(signals) {
    // Check blacklist first
    const blacklistSignal = signals.find(s => s.name === RISK_SIGNALS.BLACKLIST);
    if (blacklistSignal && blacklistSignal.score >= 100) {
      return 100;
    }

    let baseScore = 0;
    let multiplier = 1.0;

    for (const signal of signals) {
      if (signal.isMultiplier) {
        if (signal.name === RISK_SIGNALS.RECENCY && signal.score > 0) {
          // Recency is currently designed as a multiplier to the base score
          // E.g., old reports might multiply by 0.5, recent by 1.0
          // For simplicity in MVP, we might apply it only to verified reports.
          // But here we'll just apply it globally if it's < 1.0, or keep it 1.0.
          if (signal.score < 1.0) multiplier *= signal.score;
        } else if (signal.name === RISK_SIGNALS.VELOCITY && signal.score > 1.0) {
          multiplier *= signal.score;
        }
      } else {
        baseScore += signal.score;
      }
    }

    let finalScore = Math.round(baseScore * multiplier);
    
    if (finalScore < 0) finalScore = 0;
    if (finalScore > 100) finalScore = 100;

    return finalScore;
  }

  _determineRiskLevel(score) {
    if (score <= RISK_THRESHOLDS.LOW) return RISK_LEVELS.LOW;
    if (score <= RISK_THRESHOLDS.MEDIUM) return RISK_LEVELS.MEDIUM;
    return RISK_LEVELS.HIGH;
  }

  _determineConfidence(context, score) {
    const totalEvidence = context.approvedCount + context.pendingCount + context.rejectedCount;
    
    if (context.isBlacklisted) return CONFIDENCE_LEVELS.HIGH;
    
    if (totalEvidence >= 5) return CONFIDENCE_LEVELS.HIGH;
    if (totalEvidence >= 1) return CONFIDENCE_LEVELS.MEDIUM;
    
    return CONFIDENCE_LEVELS.LOW;
  }
}

export default new RiskEngineService();
