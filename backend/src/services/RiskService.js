/**
 * services/RiskService.js
 * Main entry point for the Rule-Based Risk Engine.
 * Coordinates intelligence gathering, scoring, explanations, caching, and history logging.
 */

import upiIntelligenceService from './UPIIntelligenceService.js';
import riskEngineService from './RiskEngineService.js';
import riskExplanationService from './RiskExplanationService.js';
import historyRepository from '../repositories/HistoryRepository.js';
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

    // 3. Evaluate Risk
    const engineResult = riskEngineService.evaluate(intelligence);

    // 4. Generate Explanations
    const summary = riskExplanationService.generateSummary(engineResult.riskLevel, engineResult.signals, intelligence.isUnknown);
    const reasons = riskExplanationService.generateReasons(engineResult.signals);

    // 5. Build Response
    const responseData = {
      upiId,
      riskScore: engineResult.score,
      riskLevel: engineResult.riskLevel,
      confidenceLevel: engineResult.confidenceLevel,
      summary,
      reasons,
      signals: engineResult.signals,
      fraudCategories: engineResult.fraudCategories,
      lastReportedAt: intelligence.recentReports.length > 0 
        ? intelligence.recentReports[0].createdAt 
        : null,
      checkedAt: new Date().toISOString()
    };

    if (intelligence.isUnknown) {
      responseData.warning = "Low risk does not guarantee that the recipient is legitimate.";
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
  invalidateCache(upiId) {
    riskCache.delete(this.normalizeUpiId(upiId));
  }

  /**
   * Log the risk check asynchronously.
   */
  async _logCheckHistory(userId, upiId, result, source) {
    await historyRepository.create({
      userId,
      upiId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      confidence: result.confidenceLevel, // Maps to history's confidence field
      source,
      timestamp: new Date()
    });
  }
}

export default new RiskService();
