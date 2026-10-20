/**
 * services/RiskService.js
 * Main entry point for the Rule-Based Risk Engine.
 * Coordinates intelligence gathering, scoring, explanations, caching, and history logging.
 */

import upiIntelligenceService from './UPIIntelligenceService.js';
import riskEngineService from './RiskEngineService.js';
import riskExplanationService from './RiskExplanationService.js';
import riskFusionService from './riskFusionService.js';
import historyRepository from '../repositories/HistoryRepository.js';
import analyticsService from './analytics/AnalyticsService.js';
import mlService from './mlService.js';
import { CHECK_SOURCES } from '../config/constants.js';

// Simple in-memory cache for MVP (TTL: 5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;
const riskCache = new Map();

class RiskService {
  /**
   * Evaluates the risk of a UPI ID and logs the check.
   * @param {string} rawUpiId
   * @param {object} user - The authenticated user (req.user)
   * @param {string} source - Where the check came from (e.g. WEB)
   */
  async checkRisk(rawUpiId, user, source = CHECK_SOURCES.API) {
    const upiId = this.normalizeUpiId(rawUpiId);

    // 1. Check Cache
    const cachedResult = this._getFromCache(upiId);
    if (cachedResult) {
      // Still log history asynchronously even on cache hit
      this._logCheckHistory(user.uid, upiId, cachedResult, source).catch(err => {
        console.error('Failed to log history (cache hit):', err);
      });
      return cachedResult;
    }

    // 2. Gather Intelligence
    const intelligence = await upiIntelligenceService.gatherIntelligence(upiId);

    // 3. Evaluate Rule-Based Risk Engine
    const engineResult = riskEngineService.evaluate(intelligence);

    // 4. Generate Explanations
    const summary = riskExplanationService.generateSummary(engineResult.riskLevel, engineResult.signals, intelligence.isUnknown);

    // 4b. Machine Learning Inference (Phase 8)
    const features = this._extractFeatures(upiId, intelligence, engineResult);
    const mlResult = await mlService.predict(features);

    // 4c. Intelligent Risk Fusion Engine (Phase 9)
    const fusionResult = riskFusionService.evaluateFusion(upiId, intelligence, engineResult, mlResult);

    // 5. Build Unified Response (Phase 9 structure + legacy backward compatibility)
    const responseData = {
      upiId,

      // Phase 9 Contracts
      risk: fusionResult.risk,
      signals: {
        ...fusionResult.signals,
        rule_signals: engineResult.signals,
      },
      assessment: fusionResult.assessment,

      // Preserved Legacy Fields
      riskScore: fusionResult.risk.score,
      riskLevel: fusionResult.risk.level,
      confidenceLevel: engineResult.confidenceLevel,
      summary,
      reasons: fusionResult.risk.reasons,
      fraudCategories: engineResult.fraudCategories,
      lastReportedAt: intelligence.recentReports.length > 0 
        ? intelligence.recentReports[0].createdAt 
        : null,
      checkedAt: fusionResult.assessment.scored_at,
      ml: mlResult
    };

    if (intelligence.isUnknown) {
      responseData.warning = 'Low risk does not guarantee that the recipient is legitimate.';
    }

    // 6. Update Cache
    this._setInCache(upiId, responseData);

    // 7. Log History (Async)
    this._logCheckHistory(user.uid, upiId, responseData, source).catch(err => {
      console.error('Failed to log check history:', err);
    });

    return responseData;
  }

  /**
   * Normalizes the UPI ID input.
   * @param {string} upiId
   */
  normalizeUpiId(upiId) {
    return upiId.trim().toLowerCase();
  }

  /**
   * Helper to fetch from local cache.
   */
  _getFromCache(upiId) {
    const entry = riskCache.get(upiId);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      riskCache.delete(upiId);
      return null;
    }
    return entry.data;
  }

  /**
   * Helper to set into local cache.
   */
  _setInCache(upiId, data) {
    riskCache.set(upiId, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS
    });
  }

  /**
   * Clear cache for a specific UPI ID (e.g. called when a new report is approved)
   */
  /**
   * Clear cache for a specific UPI ID (e.g. called when a new report is approved or blacklist updated)
   */
  invalidateCache(upiId) {
    riskCache.delete(this.normalizeUpiId(upiId));
  }

  /**
   * Clear the entire in-memory risk cache (e.g. called when configuration or active model changes)
   */
  clearAllCache() {
    riskCache.clear();
  }

  /**
   * Helper to extract ML features from intelligence.
   */
  _extractFeatures(upiId, intelligence, engineResult) {
    const { profile, reportStats, approvedReports } = intelligence;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    let profile_age_days = 0;
    if (profile && profile.createdAt) {
      const dt = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
      profile_age_days = Math.max(0, Math.floor((now - dt.getTime()) / dayMs));
    }

    const isKnownUpi = upiId.split('@')[1] ? 1 : 0;
    const isBlacklisted = profile?.isBlacklisted ? 1 : 0;
    const hasPreviousReports = reportStats.total > 0 ? 1 : 0;

    // Filter reports for timeframe and categories
    let reports_last_7d = 0;
    let reports_last_30d = 0;
    const categories = {
      investment_scam_reports: 0, job_scam_reports: 0, marketplace_scam_reports: 0,
      refund_scam_reports: 0, qr_scam_reports: 0, lottery_scam_reports: 0,
      digital_arrest_reports: 0, kyc_scam_reports: 0, phishing_reports: 0, other_reports: 0
    };

    approvedReports.forEach(r => {
      const dt = r.createdAt?.toDate ? r.createdAt.toDate().getTime() : new Date(r.createdAt).getTime();
      const ageDays = (now - dt) / dayMs;
      if (ageDays <= 7) reports_last_7d++;
      if (ageDays <= 30) reports_last_30d++;
      
      const key = `${r.fraudType.toLowerCase()}_reports`;
      if (categories[key] !== undefined) {
        categories[key]++;
      } else {
        categories.other_reports++;
      }
    });

    return {
      profile_age_days,
      is_known_upi: isKnownUpi,
      is_blacklisted: isBlacklisted,
      has_previous_reports: hasPreviousReports,
      total_reports: reportStats.total,
      approved_reports: reportStats.approvedCount,
      rejected_reports: reportStats.rejectedCount,
      pending_reports: reportStats.pendingCount,
      duplicate_reports: 0, // approximation for MVP
      unique_reporters: reportStats.total, // approximation
      reports_last_7d,
      reports_last_30d,
      checks_last_24h: 0, // skipping complex history scan for performance in MVP
      checks_last_7d: 0,
      high_risk_checks_last_7d: 0,
      ...categories,
      report_velocity_7d: reports_last_7d / 7,
      check_velocity_24h: 0,
      check_velocity_7d: 0,
      rule_risk_score: engineResult.score,
      blacklist_signal: isBlacklisted
    };
  }

  /**
   * Log the risk check asynchronously with compact assessment snapshot.
   */
  async _logCheckHistory(userId, upiId, result, source) {
    const finalScore = result.risk?.score ?? result.riskScore ?? 0;
    const finalLevel = result.risk?.level ?? result.riskLevel ?? 'LOW';
    const ruleScore = result.signals?.rule_score ?? result.riskScore ?? 0;
    const mlSignal = result.signals?.ml || {};

    const docRef = await historyRepository.create({
      userId,
      upiId,
      riskScore: finalScore,
      riskLevel: finalLevel,
      confidence: result.confidenceLevel, // Maps to history's confidence field
      source,
      assessment: {
        finalScore,
        riskLevel: finalLevel,
        ruleScore,
        mlAvailable: Boolean(mlSignal.available),
        mlEligible: Boolean(mlSignal.eligible_for_fusion),
        mlModelVersion: mlSignal.model_version || null,
        fusionEngineVersion: result.assessment?.engine_version || 'fusion-v1.0.0',
        configVersion: result.assessment?.config_version || '1.0.0',
        reasonCodes: (result.risk?.reasons || []).map((r) => r.code).filter(Boolean),
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });

    const isBlacklisted =
      result.signals?.blacklist?.matched ||
      (Array.isArray(result.signals) && result.signals.some((s) => s.type === 'BLACKLIST')) ||
      (result.signals?.rule_signals && result.signals.rule_signals.some((s) => s.name === 'BLACKLIST')) ||
      false;

    analyticsService.recordCheck(docRef.id, { ...result, isBlacklisted }).catch((err) => {
      console.error('Failed to log check analytics:', err);
    });
  }
}

export default new RiskService();
