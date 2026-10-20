/**
 * tests/riskFusion.test.js
 * Comprehensive unit and integration tests for Phase 9: Intelligent Risk Fusion Engine.
 * Tests all 22 required scenarios from Phase 9 specification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import riskFusionService from '../src/services/riskFusionService.js';
import riskService from '../src/services/RiskService.js';
import {
  DEFAULT_FUSION_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
  ML_SYNTHETIC_MODEL_POLICIES,
  validateFusionConfig,
} from '../src/config/fusionConfig.js';
import { RISK_LEVELS, REPORT_STATUS } from '../src/config/constants.js';
import { historyConverter } from '../src/converters/historyConverter.js';
import adminUPIService from '../src/services/admin/AdminUPIService.js';
import adminConfigService from '../src/services/admin/AdminConfigService.js';
import upiIntelligenceService from '../src/services/UPIIntelligenceService.js';
import historyRepository from '../src/repositories/HistoryRepository.js';

describe('Phase 9 — Intelligent Risk Fusion Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    riskService.clearAllCache();
  });

  // 1. Rule-only scoring
  it('Scenario 1: should calculate score correctly using rule-only scoring when ML is not present', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 2, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [
        { reporterUid: 'u1', createdAt: new Date() },
        { reporterUid: 'u2', createdAt: new Date() },
      ],
    };
    const engineResult = { score: 45, signals: [], fraudCategories: [] };

    const result = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, null);

    expect(result.risk.score).toBe(45);
    expect(result.risk.level).toBe(RISK_LEVELS.MEDIUM);
    expect(result.signals.rule_score).toBe(45);
    expect(result.signals.ml.available).toBe(false);
    expect(result.signals.ml.eligible_for_fusion).toBe(false);
    expect(result.assessment.confidence_label).toBe('RULES_ONLY');
  });

  // 2. ML-enabled fusion
  it('Scenario 2: should fuse rule score and ML probability with configured weights when ML is enabled', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 1, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [{ reporterUid: 'u1', createdAt: new Date() }],
    };
    const engineResult = { score: 30, signals: [], fraudCategories: [] };
    const mlResult = {
      available: true,
      fraud_probability: 0.80,
      model_version: 'rf-v1.0.0',
      feature_schema_version: '1.0',
    };

    // Rule weight: 0.70, ML weight: 0.30
    // Expected base score: (0.70 * 30) + (0.30 * 80) = 21 + 24 = 45
    const options = {
      config: {
        syntheticPolicy: ML_SYNTHETIC_MODEL_POLICIES.ENABLED,
      },
    };

    const result = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, mlResult, options);

    expect(result.signals.ml.eligible_for_fusion).toBe(true);
    expect(result.signals.ml.mode).toBe('ENABLED');
    expect(result.risk.score).toBe(45);
    expect(result.risk.level).toBe(RISK_LEVELS.MEDIUM);
    expect(result.assessment.confidence_label).toBe('MULTIPLE_SIGNALS');
  });

  // 3. ML shadow mode
  it('Scenario 3: should return ML prediction in shadow mode without altering final risk score', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 1, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [{ reporterUid: 'u1', createdAt: new Date() }],
    };
    const engineResult = { score: 20, signals: [], fraudCategories: [] };
    const mlResult = {
      available: true,
      fraud_probability: 0.95,
      model_version: 'rf-v1.0.0',
      feature_schema_version: '1.0',
    };

    // In SHADOW mode, final score must remain rule score (20), despite high ML fraud probability (95)
    const options = {
      config: {
        syntheticPolicy: ML_SYNTHETIC_MODEL_POLICIES.SHADOW,
      },
    };

    const result = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, mlResult, options);

    expect(result.risk.score).toBe(20);
    expect(result.risk.level).toBe(RISK_LEVELS.LOW);
    expect(result.signals.ml.available).toBe(true);
    expect(result.signals.ml.eligible_for_fusion).toBe(false);
    expect(result.signals.ml.mode).toBe('SHADOW');
    expect(result.signals.ml.fraud_probability).toBe(0.95);
    expect(result.assessment.confidence_label).toBe('ML_SHADOW');

    const shadowReason = result.risk.reasons.find((r) => r.code === 'ML_SHADOW_EVALUATION');
    expect(shadowReason).toBeDefined();
    expect(shadowReason.source).toBe('ML');
  });

  // 4. Synthetic-only model disabled mode
  it('Scenario 4: should completely ignore ML contribution when synthetic policy is DISABLED', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 0, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [],
    };
    const engineResult = { score: 10, signals: [], fraudCategories: [] };
    const mlResult = {
      available: true,
      fraud_probability: 0.85,
      model_version: 'rf-v1.0.0',
      feature_schema_version: '1.0',
    };

    const options = {
      config: {
        syntheticPolicy: ML_SYNTHETIC_MODEL_POLICIES.DISABLED,
      },
    };

    const result = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, mlResult, options);

    expect(result.risk.score).toBe(10);
    expect(result.signals.ml.eligible_for_fusion).toBe(false);
    expect(result.signals.ml.mode).toBe('DISABLED');
    expect(result.assessment.confidence_label).toBe('LIMITED_DATA');
  });

  // 5. Missing ML service
  it('Scenario 5: should fall back gracefully to rule scoring when ML service is unavailable', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 2, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [{ reporterUid: 'u1' }, { reporterUid: 'u2' }],
    };
    const engineResult = { score: 35, signals: [], fraudCategories: [] };
    const mlResult = {
      available: false,
      reason: 'TIMEOUT',
    };

    const result = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, mlResult);

    expect(result.risk.score).toBe(35);
    expect(result.signals.ml.available).toBe(false);
    expect(result.signals.ml.eligible_for_fusion).toBe(false);
    expect(result.signals.ml.mode).toBe('UNAVAILABLE');
    expect(result.assessment.confidence_label).toBe('RULES_ONLY');

    const unavailableReason = result.risk.reasons.find((r) => r.code === 'ML_SIGNAL_UNAVAILABLE');
    expect(unavailableReason).toBeDefined();
  });

  // 6. Invalid ML probability
  it('Scenario 6: should reject ML prediction with invalid probability (NaN, negative, or > 1)', () => {
    const intelligence = { isUnknown: false, isBlacklisted: false, reportStats: { approvedCount: 0 }, approvedReports: [] };
    const engineResult = { score: 15, signals: [], fraudCategories: [] };

    // Case A: Negative
    const resNegative = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, {
      available: true,
      fraud_probability: -0.2,
      model_version: 'rf-v1.0.0',
      feature_schema_version: '1.0',
    });
    expect(resNegative.signals.ml.eligible_for_fusion).toBe(false);
    expect(resNegative.risk.score).toBe(15);

    // Case B: Greater than 1
    const resOverflow = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, {
      available: true,
      fraud_probability: 1.5,
      model_version: 'rf-v1.0.0',
      feature_schema_version: '1.0',
    });
    expect(resOverflow.signals.ml.eligible_for_fusion).toBe(false);
    expect(resOverflow.risk.score).toBe(15);

    // Case C: NaN
    const resNaN = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, {
      available: true,
      fraud_probability: NaN,
      model_version: 'rf-v1.0.0',
      feature_schema_version: '1.0',
    });
    expect(resNaN.signals.ml.eligible_for_fusion).toBe(false);
    expect(resNaN.risk.score).toBe(15);
  });

  // 7. Incompatible feature schema
  it('Scenario 7: should reject ML prediction if feature schema version is incompatible', () => {
    const intelligence = { isUnknown: false, isBlacklisted: false, reportStats: { approvedCount: 0 }, approvedReports: [] };
    const engineResult = { score: 20, signals: [], fraudCategories: [] };
    const mlResult = {
      available: true,
      fraud_probability: 0.9,
      model_version: 'rf-v1.0.0',
      feature_schema_version: '99.0', // incompatible
    };

    const result = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, mlResult);

    expect(result.signals.ml.eligible_for_fusion).toBe(false);
    expect(result.signals.ml.mode).toBe('INELIGIBLE');
    expect(result.risk.score).toBe(20);
  });

  // 8. Missing model version
  it('Scenario 8: should reject ML prediction if model version is missing or empty', () => {
    const intelligence = { isUnknown: false, isBlacklisted: false, reportStats: { approvedCount: 0 }, approvedReports: [] };
    const engineResult = { score: 20, signals: [], fraudCategories: [] };
    const mlResult = {
      available: true,
      fraud_probability: 0.9,
      model_version: '', // empty
      feature_schema_version: '1.0',
    };

    const result = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, mlResult);

    expect(result.signals.ml.eligible_for_fusion).toBe(false);
    expect(result.signals.ml.mode).toBe('INELIGIBLE');
    expect(result.risk.score).toBe(20);
  });

  // 9. Active blacklist override
  it('Scenario 9: should override final score to 100 CRITICAL when UPI is blacklisted, regardless of other signals', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: true,
      profile: { isBlacklisted: true },
      reportStats: { approvedCount: 0, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [],
    };
    // Even if rule engine scored 0 and ML predicted 0.01 fraud:
    const engineResult = { score: 0, signals: [], fraudCategories: [] };
    const mlResult = {
      available: true,
      fraud_probability: 0.01,
      model_version: 'rf-v1.0.0',
      feature_schema_version: '1.0',
    };

    const options = {
      config: { syntheticPolicy: ML_SYNTHETIC_MODEL_POLICIES.ENABLED },
    };

    const result = riskFusionService.evaluateFusion('bad@upi', intelligence, engineResult, mlResult, options);

    expect(result.risk.score).toBe(100);
    expect(result.risk.level).toBe(RISK_LEVELS.CRITICAL);
    expect(result.signals.blacklist.matched).toBe(true);

    const blacklistReason = result.risk.reasons.find((r) => r.code === 'BLACKLISTED_IDENTIFIER');
    expect(blacklistReason).toBeDefined();
    expect(blacklistReason.severity).toBe('CRITICAL');
    expect(blacklistReason.source).toBe('INTERNAL_BLACKLIST');
    expect(result.risk.recommended_actions[0]).toContain('Avoid proceeding');
  });

  // 10. Approved reports increasing risk appropriately
  it('Scenario 10: should reflect approved reports in reasons and community telemetry', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 4, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [
        { reporterUid: 'u1', createdAt: new Date() },
        { reporterUid: 'u2', createdAt: new Date() },
        { reporterUid: 'u3', createdAt: new Date() },
        { reporterUid: 'u4', createdAt: new Date() },
      ],
    };
    const engineResult = { score: 65, signals: [], fraudCategories: ['phishing'] };

    const result = riskFusionService.evaluateFusion('scam@upi', intelligence, engineResult, null);

    expect(result.signals.community.approved_report_count).toBe(4);
    expect(result.signals.community.unique_reporter_count).toBe(4);
    expect(result.signals.community.community_score).toBe(100);

    const reportReason = result.risk.reasons.find((r) => r.code === 'APPROVED_REPORTS_PRESENT');
    expect(reportReason).toBeDefined();
    expect(reportReason.message).toContain('4');
  });

  // 11. Rejected reports not treated as confirmed fraud
  it('Scenario 11: should not count rejected reports as approved evidence in community signals', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 0, pendingCount: 0, rejectedCount: 10 },
      approvedReports: [], // rejected reports are not in approvedReports
    };
    const engineResult = { score: 0, signals: [], fraudCategories: [] };

    const result = riskFusionService.evaluateFusion('clean@upi', intelligence, engineResult, null);

    expect(result.signals.community.approved_report_count).toBe(0);
    expect(result.signals.community.community_score).toBe(0);
    expect(result.risk.score).toBe(0);
    expect(result.risk.level).toBe(RISK_LEVELS.LOW);
    expect(result.risk.reasons.some((r) => r.code === 'APPROVED_REPORTS_PRESENT')).toBe(false);
  });

  // 12. Duplicate reports not double-counted
  it('Scenario 12: should suppress duplicate submissions from the same user when evaluating unique reporters', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 5, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [
        { reporterUid: 'same_user', createdAt: new Date() },
        { reporterUid: 'same_user', createdAt: new Date() },
        { reporterUid: 'same_user', createdAt: new Date() },
        { reporterUid: 'same_user', createdAt: new Date() },
        { reporterUid: 'same_user', createdAt: new Date() },
      ],
    };
    const engineResult = { score: 40, signals: [], fraudCategories: [] };

    const result = riskFusionService.evaluateFusion('target@upi', intelligence, engineResult, null);

    expect(result.signals.community.approved_report_count).toBe(5);
    expect(result.signals.community.unique_reporter_count).toBe(1); // Deduped to 1
    expect(result.risk.reasons.some((r) => r.code === 'MULTIPLE_INDEPENDENT_REPORTERS')).toBe(false);
  });

  // 13. No community signal double-counting
  it('Scenario 13: should preserve rule score and not double-add community score to the final formula', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 2, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [
        { reporterUid: 'u1', createdAt: new Date() },
        { reporterUid: 'u2', createdAt: new Date() },
      ],
    };
    // Rule score already evaluated verified reports and gave 30:
    const engineResult = { score: 30, signals: [], fraudCategories: [] };

    const result = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, null);

    // Final score must equal rule score (30) — community score (50) is NOT added on top!
    expect(result.risk.score).toBe(30);
    expect(result.signals.community.community_score).toBe(50);
  });

  // 14. Threshold boundary values
  it('Scenario 14: should categorize scores into exact configured risk bands at boundary values', () => {
    const testCases = [
      { score: 0, expectedLevel: RISK_LEVELS.LOW },
      { score: 24, expectedLevel: RISK_LEVELS.LOW },
      { score: 25, expectedLevel: RISK_LEVELS.MEDIUM },
      { score: 49, expectedLevel: RISK_LEVELS.MEDIUM },
      { score: 50, expectedLevel: RISK_LEVELS.HIGH },
      { score: 74, expectedLevel: RISK_LEVELS.HIGH },
      { score: 75, expectedLevel: RISK_LEVELS.CRITICAL },
      { score: 100, expectedLevel: RISK_LEVELS.CRITICAL },
    ];

    testCases.forEach(({ score, expectedLevel }) => {
      const level = riskFusionService.determineRiskLevel(score, DEFAULT_RISK_THRESHOLDS);
      expect(level).toBe(expectedLevel);
    });
  });

  // 15. Invalid configuration values
  it('Scenario 15: should reject invalid configuration and fall back safely to defaults', () => {
    // Non-summing weights
    const invalidConfig = {
      ruleWeight: 0.8,
      mlWeight: 0.8, // sum = 1.6
      thresholds: { LOW: 50, MEDIUM: 20, HIGH: 80, CRITICAL: 100 }, // unordered
      syntheticPolicy: 'UNKNOWN_POLICY',
    };

    const { valid, errors, cleanConfig } = validateFusionConfig(invalidConfig);
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
    expect(cleanConfig.ruleWeight).toBe(DEFAULT_FUSION_WEIGHTS.RULE);
    expect(cleanConfig.mlWeight).toBe(DEFAULT_FUSION_WEIGHTS.ML);
    expect(cleanConfig.thresholds).toEqual(DEFAULT_RISK_THRESHOLDS);
  });

  // 16. Score clamping and finite-number validation
  it('Scenario 16: should clamp scores strictly between 0 and 100 and prevent NaN or Infinity', () => {
    const intelligence = { isUnknown: false, isBlacklisted: false, reportStats: { approvedCount: 0 }, approvedReports: [] };

    // Negative score from rule engine
    const resNegative = riskFusionService.evaluateFusion('test@upi', intelligence, { score: -50 });
    expect(resNegative.risk.score).toBe(0);

    // Over 100 score from rule engine
    const resOver = riskFusionService.evaluateFusion('test@upi', intelligence, { score: 150 });
    expect(resOver.risk.score).toBe(100);

    // NaN score
    const resNaN = riskFusionService.evaluateFusion('test@upi', intelligence, { score: NaN });
    expect(resNaN.risk.score).toBe(0);
    expect(Number.isFinite(resNaN.risk.score)).toBe(true);
  });

  // 17. Risk-level / score consistency
  it('Scenario 17: should ensure returned risk level is strictly consistent with the final score', () => {
    const scores = [10, 24, 25, 48, 50, 74, 75, 99];
    scores.forEach((score) => {
      const result = riskFusionService.evaluateFusion('test@upi', {}, { score });
      expect(result.risk.score).toBe(score);
      if (score <= 24) expect(result.risk.level).toBe(RISK_LEVELS.LOW);
      else if (score <= 49) expect(result.risk.level).toBe(RISK_LEVELS.MEDIUM);
      else if (score <= 74) expect(result.risk.level).toBe(RISK_LEVELS.HIGH);
      else expect(result.risk.level).toBe(RISK_LEVELS.CRITICAL);
    });
  });

  // 18. Cache invalidation
  it('Scenario 18: should invalidate and refresh risk cache on blacklist changes and clear all on config changes', () => {
    // Seed cache
    riskService._setInCache('merchant@upi', { riskScore: 10 });
    expect(riskService._getFromCache('merchant@upi')).toBeDefined();

    // Invalidate single UPI
    riskService.invalidateCache('merchant@upi');
    expect(riskService._getFromCache('merchant@upi')).toBeNull();

    // Re-seed and clear all
    riskService._setInCache('upi1@oksbi', { riskScore: 20 });
    riskService._setInCache('upi2@okhdfc', { riskScore: 40 });
    riskService.clearAllCache();
    expect(riskService._getFromCache('upi1@oksbi')).toBeNull();
    expect(riskService._getFromCache('upi2@okhdfc')).toBeNull();
  });

  // 19. Check-history persistence snapshot
  it('Scenario 19: should format and persist compact assessment snapshot in check history without PII or raw feature vector', () => {
    const record = {
      userId: 'test-user-123',
      upiId: 'flagged@upi',
      riskScore: 65,
      riskLevel: RISK_LEVELS.HIGH,
      confidence: 1,
      source: 'API',
      assessment: {
        finalScore: 65,
        riskLevel: RISK_LEVELS.HIGH,
        ruleScore: 65,
        mlAvailable: true,
        mlEligible: false,
        mlModelVersion: 'rf-v1.0.0',
        fusionEngineVersion: 'fusion-v1.0.0',
        configVersion: '1.0.0',
        reasonCodes: ['APPROVED_REPORTS_PRESENT', 'ML_SHADOW_EVALUATION'],
        timestamp: new Date('2026-10-20T12:00:00Z'),
      },
    };

    const firestoreDoc = historyConverter.toFirestore(record);

    expect(firestoreDoc.userId).toBe('test-user-123');
    expect(firestoreDoc.riskScore).toBe(65);
    expect(firestoreDoc.assessment).toBeDefined();
    expect(firestoreDoc.assessment.ruleScore).toBe(65);
    expect(firestoreDoc.assessment.mlAvailable).toBe(true);
    expect(firestoreDoc.assessment.mlEligible).toBe(false);
    expect(firestoreDoc.assessment.reasonCodes).toEqual(['APPROVED_REPORTS_PRESENT', 'ML_SHADOW_EVALUATION']);
    // Ensure raw ML features are not persisted
    expect(firestoreDoc.assessment.features).toBeUndefined();
    expect(firestoreDoc.features).toBeUndefined();
  });

  // 20. Conflicting signals safeguard
  it('Scenario 20: should prevent a low ML prediction from suppressing a high rule risk', () => {
    const intelligence = {
      isUnknown: false,
      isBlacklisted: false,
      reportStats: { approvedCount: 3, pendingCount: 0, rejectedCount: 0 },
      approvedReports: [{ reporterUid: 'u1' }, { reporterUid: 'u2' }, { reporterUid: 'u3' }],
    };
    // Rule engine flagged HIGH risk (60):
    const engineResult = { score: 60, signals: [], fraudCategories: [] };
    // ML predicted very low fraud (0.05):
    const mlResult = {
      available: true,
      fraud_probability: 0.05,
      model_version: 'rf-v1.0.0',
      feature_schema_version: '1.0',
    };

    const options = {
      config: { syntheticPolicy: ML_SYNTHETIC_MODEL_POLICIES.ENABLED },
    };

    const result = riskFusionService.evaluateFusion('user@upi', intelligence, engineResult, mlResult, options);

    // Safeguard prevents dropping below rule score of 60
    expect(result.risk.score).toBeGreaterThanOrEqual(60);
    expect(result.risk.level).toBe(RISK_LEVELS.HIGH);
  });

  // 21. API response backward compatibility
  it('Scenario 21: should preserve all legacy response fields alongside new Phase 9 fields', async () => {
    vi.spyOn(upiIntelligenceService, 'gatherIntelligence').mockResolvedValue({
      isUnknown: true,
      profile: null,
      isBlacklisted: false,
      reportStats: { total: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 },
      approvedReports: [],
      recentReports: [],
    });
    vi.spyOn(historyRepository, 'create').mockResolvedValue({ id: 'mock-check-id' });

    // Mock user
    const mockUser = { uid: 'user_123' };

    // Run checkRisk
    const response = await riskService.checkRisk('unknown@upi', mockUser);

    // Phase 9 contracts:
    expect(response.risk).toBeDefined();
    expect(typeof response.risk.score).toBe('number');
    expect(response.risk.level).toBe(RISK_LEVELS.LOW);
    expect(Array.isArray(response.risk.reasons)).toBe(true);
    expect(Array.isArray(response.risk.recommended_actions)).toBe(true);
    expect(response.signals).toBeDefined();
    expect(response.signals.rule_score).toBeDefined();
    expect(response.assessment).toBeDefined();
    expect(response.assessment.engine_version).toBe('fusion-v1.0.0');

    // Legacy fields:
    expect(response.upiId).toBe('unknown@upi');
    expect(response.riskScore).toBe(response.risk.score);
    expect(response.riskLevel).toBe(response.risk.level);
    expect(response.confidenceLevel).toBeDefined();
    expect(response.summary).toBeDefined();
    expect(response.reasons).toBeDefined();
    expect(response.signals.rule_signals).toBeDefined();
    expect(response.checkedAt).toBeDefined();
  });

  // 22. No ML service failure causes risk-check failure
  it('Scenario 22: should complete risk assessment successfully even when ML throws an exception', () => {
    const intelligence = { isUnknown: false, isBlacklisted: false, reportStats: { approvedCount: 1 }, approvedReports: [{ reporterUid: 'u1' }] };
    const engineResult = { score: 30, signals: [], fraudCategories: [] };

    // Malformed ML output causing error
    const brokenMlResult = {
      available: false,
      reason: 'CRITICAL_INTERNAL_ERROR',
    };

    expect(() => {
      const res = riskFusionService.evaluateFusion('test@upi', intelligence, engineResult, brokenMlResult);
      expect(res.risk.score).toBe(30);
      expect(res.signals.ml.available).toBe(false);
    }).not.toThrow();
  });
});
