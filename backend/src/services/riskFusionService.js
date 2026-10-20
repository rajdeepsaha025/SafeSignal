/**
 * services/riskFusionService.js
 * Phase 9: Intelligent Risk Fusion Engine
 *
 * Unifies rule-based risk scoring, ML inference probability, internal blacklist intelligence,
 * and moderated community report signals into an explainable, auditable risk assessment.
 */

import { RISK_LEVELS, REPORT_STATUS } from '../config/constants.js';
import {
  FUSION_ENGINE_VERSION,
  FUSION_CONFIG_VERSION,
  DEFAULT_FUSION_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
  ML_SYNTHETIC_MODEL_POLICIES,
  SUPPORTED_FEATURE_SCHEMA_VERSIONS,
  validateFusionConfig,
} from '../config/fusionConfig.js';
import logger from '../config/logger.js';

class RiskFusionService {
  /**
   * Main fusion evaluation method.
   *
   * @param {string} upiId - Normalized UPI ID
   * @param {object} intelligence - Data from UPIIntelligenceService
   * @param {object} engineResult - Result from RiskEngineService (rule score & signals)
   * @param {object} [mlResult] - Result from MLService (fraud_probability, etc.)
   * @param {object} [options] - Optional custom config overrides
   * @returns {object} Structured fusion assessment
   */
  evaluateFusion(upiId, intelligence = {}, engineResult = {}, mlResult = null, options = {}) {
    // 1. Validate and clean configuration
    const { cleanConfig, errors: configErrors } = validateFusionConfig(options.config);
    if (configErrors && configErrors.length > 0) {
      logger.warn('[RiskFusionService] Configuration warning, falling back to defaults:', {
        errors: configErrors,
      });
    }

    // 2. Validate and normalize inputs
    const normalizedUpiId = (upiId || '').trim().toLowerCase();
    const isUnknown = Boolean(intelligence.isUnknown);
    const isBlacklisted = Boolean(intelligence.isBlacklisted || intelligence.profile?.isBlacklisted);

    const rawRuleScore = typeof engineResult.score === 'number' ? engineResult.score : 0;
    let ruleScore = Number.isFinite(rawRuleScore)
      ? Math.max(0, Math.min(100, Math.round(rawRuleScore)))
      : 0;

    // If ruleScore is 0 but intelligence.profile?.riskScore is present in Firestore:
    if (ruleScore === 0 && typeof intelligence.profile?.riskScore === 'number' && intelligence.profile.riskScore > 0) {
      ruleScore = Math.max(0, Math.min(100, Math.round(intelligence.profile.riskScore)));
    }

    // 3. Process Community Intelligence (without double counting)
    const communityStats = this.calculateCommunitySignals(intelligence);

    // 4. Evaluate ML Signal & Eligibility
    const mlEvaluation = this.evaluateMLEligibility(mlResult, cleanConfig);

    // 5. Calculate Base Score via Configurable Weights
    let baseScore = ruleScore;
    if (mlEvaluation.eligible_for_fusion) {
      const mlScore = mlEvaluation.fraud_probability * 100;
      baseScore = Math.round(
        cleanConfig.ruleWeight * ruleScore + cleanConfig.mlWeight * mlScore
      );
    }
    baseScore = Math.max(0, Math.min(100, baseScore));

    // 6. Apply Deterministic Overrides and Safeguards
    let finalScore = baseScore;
    let blacklistOverride = false;

    if (isBlacklisted) {
      // Confirmed internal blacklist: immediately override to 100 CRITICAL
      finalScore = 100;
      blacklistOverride = true;
    } else if (mlEvaluation.eligible_for_fusion) {
      // Conflicting signals safeguard:
      // If rule score is HIGH (>=50) or CRITICAL, a low ML prediction cannot suppress confirmed rule risk.
      if (ruleScore >= cleanConfig.thresholds.MEDIUM + 1 && baseScore < ruleScore) {
        finalScore = ruleScore;
      }
    }

    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    // 7. Determine Final Risk Level
    const riskLevel = this.determineRiskLevel(finalScore, cleanConfig.thresholds);

    // 8. Generate Evidence-Based Reasons
    const reasons = this.generateReasons({
      isUnknown,
      isBlacklisted,
      blacklistOverride,
      ruleScore,
      engineSignals: engineResult.signals || [],
      fraudCategories: engineResult.fraudCategories || [],
      communityStats,
      mlEvaluation,
      finalScore,
    });

    // 9. Generate Recommended Actions
    const recommendedActions = this.generateRecommendedActions(riskLevel);

    // 10. Determine Confidence Label
    const confidenceLabel = this.determineConfidenceLabel(
      isUnknown,
      mlEvaluation,
      communityStats
    );

    // 11. Construct Structured Auditable Result
    return {
      risk: {
        score: finalScore,
        level: riskLevel,
        reasons,
        recommended_actions: recommendedActions,
      },
      signals: {
        rule_score: ruleScore,
        ml: {
          available: mlEvaluation.available,
          eligible_for_fusion: mlEvaluation.eligible_for_fusion,
          mode: mlEvaluation.mode,
          fraud_probability: mlEvaluation.fraud_probability,
          model_version: mlEvaluation.model_version || null,
        },
        community: {
          available: communityStats.approved_report_count > 0 || communityStats.pending_report_count > 0,
          approved_report_count: communityStats.approved_report_count,
          unique_reporter_count: communityStats.unique_reporter_count,
          recent_report_count: communityStats.recent_report_count,
          signal_freshness: communityStats.signal_freshness,
          community_score: communityStats.community_score,
        },
        blacklist: {
          matched: isBlacklisted,
        },
      },
      assessment: {
        engine_version: FUSION_ENGINE_VERSION,
        config_version: FUSION_CONFIG_VERSION,
        scored_at: new Date().toISOString(),
        confidence_label: confidenceLabel,
      },
    };
  }

  /**
   * Calculates community signal metrics and explainability without double-counting.
   * Reports are segregated by moderation status (APPROVED, PENDING, REJECTED).
   *
   * @param {object} intelligence
   * @returns {object} Community intelligence statistics
   */
  calculateCommunitySignals(intelligence = {}) {
    const reports = intelligence.approvedReports || [];
    const reportStats = intelligence.reportStats || {
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
    };

    // Filter strictly to approved reports
    const approvedReports = reports.filter(
      (r) => r.status === REPORT_STATUS.APPROVED || !r.status
    );

    // Suppress duplicates to count distinct citizens
    const reporterUids = new Set(
      approvedReports
        .map((r) => r.reporterUid || r.userId)
        .filter((uid) => Boolean(uid) && uid !== 'anonymous')
    );
    const uniqueReporterCount =
      reporterUids.size > 0
        ? reporterUids.size
        : approvedReports.length > 0
        ? 1
        : 0;

    // Recency evaluation
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let recentReportCount = 0;
    let freshestDays = Infinity;

    for (const report of approvedReports) {
      const dt = report.createdAt?.toDate
        ? report.createdAt.toDate().getTime()
        : new Date(report.createdAt || now).getTime();
      const ageDays = Math.max(0, (now - dt) / dayMs);
      if (ageDays < freshestDays) {
        freshestDays = ageDays;
      }
      if (ageDays <= 7) {
        recentReportCount++;
      }
    }

    let signalFreshness = 'NO_REPORTS';
    if (approvedReports.length > 0) {
      if (freshestDays <= 1) signalFreshness = 'LAST_24_HOURS';
      else if (freshestDays <= 7) signalFreshness = 'LAST_7_DAYS';
      else if (freshestDays <= 30) signalFreshness = 'LAST_30_DAYS';
      else signalFreshness = 'OLDER_THAN_30_DAYS';
    }

    // Normalized community score (0–100) for telemetry/explainability
    // Scaled by unique reporters and approved count
    let communityScore = 0;
    if (approvedReports.length >= 5 || uniqueReporterCount >= 4) {
      communityScore = 100;
    } else if (approvedReports.length >= 3 || uniqueReporterCount >= 3) {
      communityScore = 75;
    } else if (approvedReports.length >= 2 || uniqueReporterCount >= 2) {
      communityScore = 50;
    } else if (approvedReports.length >= 1) {
      communityScore = 25;
    }

    return {
      approved_report_count: reportStats.approvedCount || approvedReports.length,
      pending_report_count: reportStats.pendingCount || 0,
      rejected_report_count: reportStats.rejectedCount || 0,
      unique_reporter_count: uniqueReporterCount,
      recent_report_count: recentReportCount,
      signal_freshness: signalFreshness,
      community_score: communityScore,
    };
  }

  /**
   * Validates ML response and determines fusion eligibility.
   *
   * @param {object} mlResult
   * @param {object} config
   * @returns {object} Evaluated ML parameters
   */
  evaluateMLEligibility(mlResult, config) {
    if (!mlResult || !mlResult.available) {
      return {
        available: false,
        eligible_for_fusion: false,
        mode: 'UNAVAILABLE',
        fraud_probability: null,
        model_version: mlResult?.model_version || null,
        reason: mlResult?.reason || 'ML_SERVICE_UNAVAILABLE',
      };
    }

    const prob = mlResult.fraud_probability;
    const modelVersion = mlResult.model_version;
    const schemaVersion = mlResult.feature_schema_version;

    // Validate probability
    const isValidProb =
      typeof prob === 'number' && Number.isFinite(prob) && prob >= 0 && prob <= 1;

    // Validate model version
    const isValidModel = typeof modelVersion === 'string' && modelVersion.trim().length > 0;

    // Validate schema compatibility
    const isCompatibleSchema =
      typeof schemaVersion === 'string' &&
      SUPPORTED_FEATURE_SCHEMA_VERSIONS.includes(schemaVersion);

    if (!isValidProb || !isValidModel || !isCompatibleSchema) {
      return {
        available: true,
        eligible_for_fusion: false,
        mode: 'INELIGIBLE',
        fraud_probability: isValidProb ? prob : null,
        model_version: isValidModel ? modelVersion : null,
        reason: !isValidProb
          ? 'INVALID_PROBABILITY'
          : !isValidModel
          ? 'MISSING_MODEL_VERSION'
          : 'INCOMPATIBLE_FEATURE_SCHEMA',
      };
    }

    // Evaluate synthetic model policy
    const policy = config.syntheticPolicy || ML_SYNTHETIC_MODEL_POLICIES.SHADOW;

    if (policy === ML_SYNTHETIC_MODEL_POLICIES.DISABLED) {
      return {
        available: true,
        eligible_for_fusion: false,
        mode: 'DISABLED',
        fraud_probability: prob,
        model_version: modelVersion,
        reason: 'SYNTHETIC_MODEL_DISABLED',
      };
    }

    if (policy === ML_SYNTHETIC_MODEL_POLICIES.SHADOW) {
      return {
        available: true,
        eligible_for_fusion: false,
        mode: 'SHADOW',
        fraud_probability: prob,
        model_version: modelVersion,
        reason: 'SYNTHETIC_MODEL_IN_SHADOW_MODE',
      };
    }

    // ENABLED mode: explicitly permitted
    return {
      available: true,
      eligible_for_fusion: true,
      mode: 'ENABLED',
      fraud_probability: prob,
      model_version: modelVersion,
      reason: null,
    };
  }

  /**
   * Maps a numerical score to the configured risk level bands.
   * LOW: 0–24, MEDIUM: 25–49, HIGH: 50–74, CRITICAL: 75–100
   *
   * @param {number} score
   * @param {object} thresholds
   * @returns {string} RISK_LEVELS.*
   */
  determineRiskLevel(score, thresholds = DEFAULT_RISK_THRESHOLDS) {
    if (score <= thresholds.LOW) return RISK_LEVELS.LOW;
    if (score <= thresholds.MEDIUM) return RISK_LEVELS.MEDIUM;
    if (score <= thresholds.HIGH) return RISK_LEVELS.HIGH;
    return RISK_LEVELS.CRITICAL;
  }

  /**
   * Generates evidence-based reasons with strict schema: { code, message, severity, source }.
   * Also populates title & description for backward compatibility with legacy consumers.
   *
   * @param {object} context
   * @returns {Array<object>}
   */
  generateReasons(context) {
    const reasons = [];

    // 1. Blacklist
    if (context.isBlacklisted) {
      reasons.push({
        code: 'BLACKLISTED_IDENTIFIER',
        message: 'The identifier matches an active SafeSignal internal blacklist entry.',
        severity: 'CRITICAL',
        source: 'INTERNAL_BLACKLIST',
        title: 'Blacklisted identifier',
        description: 'UPI ID is currently listed as blacklisted in SafeSignal intelligence.',
      });
    }

    // 2. Community Approved Reports
    if (context.communityStats.approved_report_count > 0) {
      const count = context.communityStats.approved_report_count;
      reasons.push({
        code: 'APPROVED_REPORTS_PRESENT',
        message:
          count === 1
            ? '1 approved fraud report is associated with this identifier.'
            : `Multiple approved reports (${count}) are associated with this identifier.`,
        severity: count >= 3 ? 'HIGH' : 'MEDIUM',
        source: 'COMMUNITY',
        title: 'Approved reports',
        description: `${count} citizen reports have been verified by moderators.`,
      });
    }

    // 3. Unique Independent Reporters
    if (context.communityStats.unique_reporter_count >= 2) {
      reasons.push({
        code: 'MULTIPLE_INDEPENDENT_REPORTERS',
        message: `Reports have been independently submitted by ${context.communityStats.unique_reporter_count} distinct citizens.`,
        severity: 'HIGH',
        source: 'COMMUNITY',
        title: 'Multiple independent reporters',
        description: 'Multiple distinct citizen accounts submitted verified reports.',
      });
    }

    // 4. Recency & Velocity
    if (context.communityStats.recent_report_count > 0) {
      reasons.push({
        code: 'RECENT_FRAUD_REPORTS',
        message: 'Recent approved reports indicate elevated risk within the last 7 days.',
        severity: 'HIGH',
        source: 'COMMUNITY',
        title: 'Recent fraud activity',
        description: 'Approved fraud reports were logged recently for this identifier.',
      });
    }

    // 5. Fraud Categories
    if (context.fraudCategories && context.fraudCategories.length > 0) {
      const cats = context.fraudCategories.join(', ');
      reasons.push({
        code: 'SCAM_CATEGORY_FLAGGED',
        message: `Identifier has been reported for suspicious activities: ${cats}.`,
        severity: 'HIGH',
        source: 'COMMUNITY',
        title: 'Reported scam categories',
        description: `Associated with reported fraud categories: ${cats}.`,
      });
    }

    // 6. Rule Risk Indicators
    if (context.ruleScore >= 25 && !context.isBlacklisted && context.communityStats.approved_report_count === 0) {
      reasons.push({
        code: 'RULE_RISK_INDICATORS',
        message: 'The rule engine detected elevated risk indicators based on account velocity or pending claims.',
        severity: context.ruleScore >= 50 ? 'HIGH' : 'MEDIUM',
        source: 'RULES',
        title: 'Risk indicators detected',
        description: 'Deterministic rules flagged potential anomalies on this identifier.',
      });
    }

    // 7. ML Evaluation
    const { mlEvaluation } = context;
    if (mlEvaluation.available) {
      if (mlEvaluation.mode === 'SHADOW') {
        reasons.push({
          code: 'ML_SHADOW_EVALUATION',
          message: 'The ML signal is available for internal evaluation but is not enabled in the final score.',
          severity: 'LOW',
          source: 'ML',
          title: 'ML Shadow Evaluation',
          description: `Machine Learning estimated fraud probability (${((mlEvaluation.fraud_probability || 0) * 100).toFixed(1)}%) in shadow mode.`,
        });
      } else if (mlEvaluation.mode === 'ENABLED' && mlEvaluation.eligible_for_fusion) {
        if (mlEvaluation.fraud_probability >= 0.5) {
          reasons.push({
            code: 'ML_FRAUD_PROBABILITY_ELEVATED',
            message: `ML model predicted an elevated fraud probability of ${(mlEvaluation.fraud_probability * 100).toFixed(1)}%.`,
            severity: 'HIGH',
            source: 'ML',
            title: 'Elevated ML fraud score',
            description: 'Statistical classification model flagged pattern similarities with known fraud.',
          });
        } else if (mlEvaluation.fraud_probability < 0.2) {
          reasons.push({
            code: 'ML_FRAUD_PROBABILITY_LOW',
            message: `ML model predicted a low fraud probability of ${(mlEvaluation.fraud_probability * 100).toFixed(1)}%.`,
            severity: 'LOW',
            source: 'ML',
            title: 'Low ML fraud score',
            description: 'Statistical classification model observed low probability of fraud patterns.',
          });
        }
      }
    } else if (mlEvaluation.mode === 'UNAVAILABLE') {
      reasons.push({
        code: 'ML_SIGNAL_UNAVAILABLE',
        message: 'The ML inference service was unavailable; risk score was evaluated using deterministic rules.',
        severity: 'LOW',
        source: 'SYSTEM',
        title: 'ML service unavailable',
        description: 'Inference service offline; deterministic rules ensured uninterrupted risk checking.',
      });
    }

    // 8. Clean / Unknown Identifier
    if (context.isUnknown || reasons.length === 0) {
      reasons.push({
        code: 'NO_KNOWN_REPORTS',
        message: 'No previous reports or risk indicators have been recorded in SafeSignal.',
        severity: 'LOW',
        source: 'SYSTEM',
        title: 'No known risk indicators',
        description: 'Identifier has no existing flags or verified community reports.',
      });
    }

    return reasons;
  }

  /**
   * Generates actionable safety recommendations matching the risk level.
   *
   * @param {string} riskLevel - RISK_LEVELS.*
   * @returns {Array<string>}
   */
  generateRecommendedActions(riskLevel) {
    switch (riskLevel) {
      case RISK_LEVELS.LOW:
        return [
          'No major risk indicators were detected in available SafeSignal data.',
          'Verify the recipient and payment details before approving a payment.',
        ];

      case RISK_LEVELS.MEDIUM:
        return [
          'Pause and independently verify the recipient.',
          'Review the displayed risk reasons before proceeding.',
        ];

      case RISK_LEVELS.HIGH:
        return [
          'Do not proceed until you independently verify the recipient.',
          "Use a trusted contact or your payment provider's official support channel if uncertain.",
        ];

      case RISK_LEVELS.CRITICAL:
      default:
        return [
          'Avoid proceeding with the payment.',
          'Verify the recipient through your payment provider.',
          'If money has already been lost, contact your bank and the appropriate official cybercrime reporting channel promptly.',
        ];
    }
  }

  /**
   * Resolves an honest confidence label based on signal coverage and verification status.
   * Labels: INSUFFICIENT_DATA, MULTIPLE_SIGNALS, ML_SHADOW, RULES_ONLY, LIMITED_DATA
   *
   * @param {boolean} isUnknown
   * @param {object} mlEvaluation
   * @param {object} communityStats
   * @returns {string}
   */
  determineConfidenceLabel(isUnknown, mlEvaluation, communityStats) {
    if (isUnknown) {
      return 'INSUFFICIENT_DATA';
    }
    if (mlEvaluation.eligible_for_fusion) {
      return 'MULTIPLE_SIGNALS';
    }
    if (mlEvaluation.available && mlEvaluation.mode === 'SHADOW') {
      return 'ML_SHADOW';
    }
    if (
      communityStats.approved_report_count < 2 &&
      communityStats.pending_report_count === 0
    ) {
      return 'LIMITED_DATA';
    }
    return 'RULES_ONLY';
  }
}

export default new RiskFusionService();
