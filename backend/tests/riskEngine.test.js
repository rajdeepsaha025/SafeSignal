import { describe, it, expect } from 'vitest';
import riskEngineService from '../src/services/RiskEngineService.js';
import riskService from '../src/services/RiskService.js';
import riskExplanationService from '../src/services/RiskExplanationService.js';
import { riskCheckSchema } from '../src/validators/riskValidator.js';
import { RISK_LEVELS } from '../src/constants/riskLevels.js';
import { CONFIDENCE_LEVELS } from '../src/config/riskConfig.js';
import { RISK_SIGNALS } from '../src/constants/riskSignals.js';

describe('UPI Normalization', () => {
  it('should trim and lowercase the UPI ID', () => {
    expect(riskService.normalizeUpiId(' MERCHANT@OKSBI ')).toBe('merchant@oksbi');
    expect(riskService.normalizeUpiId('User@ybl')).toBe('user@ybl');
  });
});

describe('UPI Validation', () => {
  it('should pass valid UPI IDs', () => {
    const result = riskCheckSchema.safeParse({ body: { upiId: 'user@ybl' }});
    expect(result.success).toBe(true);
  });

  it('should reject invalid UPI IDs', () => {
    const result1 = riskCheckSchema.safeParse({ body: { upiId: 'user' }});
    expect(result1.success).toBe(false);
    
    const result2 = riskCheckSchema.safeParse({ body: { upiId: 'user@' }});
    expect(result2.success).toBe(false);
    
    const result3 = riskCheckSchema.safeParse({ body: { upiId: '@ybl' }});
    expect(result3.success).toBe(false);
  });
});

describe('Risk Engine Service', () => {
  it('should handle Unknown UPI correctly', () => {
    const intelligence = {
      isUnknown: true,
      profile: null,
      isBlacklisted: false,
      reportStats: { total: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 },
      approvedReports: [],
      recentReports: []
    };

    const result = riskEngineService.evaluate(intelligence);
    expect(result.score).toBe(0);
    expect(result.riskLevel).toBe(RISK_LEVELS.LOW);
    expect(result.confidenceLevel).toBe(CONFIDENCE_LEVELS.LOW);
  });

  it('should apply maximum score for Blacklisted UPI', () => {
    const intelligence = {
      isUnknown: false,
      profile: { isBlacklisted: true },
      isBlacklisted: true,
      reportStats: { total: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 },
      approvedReports: [],
      recentReports: []
    };

    const result = riskEngineService.evaluate(intelligence);
    expect(result.score).toBe(100);
    expect(result.riskLevel).toBe(RISK_LEVELS.HIGH);
    expect(result.confidenceLevel).toBe(CONFIDENCE_LEVELS.HIGH);
    
    const blacklistSignal = result.signals.find(s => s.name === RISK_SIGNALS.BLACKLIST);
    expect(blacklistSignal.score).toBe(100);
  });

  it('should scale score with Verified Reports (1 report)', () => {
    const intelligence = {
      isUnknown: false,
      profile: {},
      isBlacklisted: false,
      reportStats: { total: 1, pendingCount: 0, approvedCount: 1, rejectedCount: 0 },
      approvedReports: [{ createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) }], // older than 30 days
      recentReports: []
    };

    const result = riskEngineService.evaluate(intelligence);
    expect(result.score).toBeGreaterThan(0);
    
    const verifiedSignal = result.signals.find(s => s.name === RISK_SIGNALS.VERIFIED_REPORTS);
    expect(verifiedSignal.score).toBe(15);
  });

  it('should add small influence for Pending Reports', () => {
    const intelligence = {
      isUnknown: false,
      profile: {},
      isBlacklisted: false,
      reportStats: { total: 3, pendingCount: 3, approvedCount: 0, rejectedCount: 0 },
      approvedReports: [],
      recentReports: []
    };

    const result = riskEngineService.evaluate(intelligence);
    expect(result.score).toBe(6); // 3 * 2
  });

  it('should NOT increase risk for Rejected Reports', () => {
    const intelligence = {
      isUnknown: false,
      profile: {},
      isBlacklisted: false,
      reportStats: { total: 10, pendingCount: 0, approvedCount: 0, rejectedCount: 10 },
      approvedReports: [],
      recentReports: []
    };

    const result = riskEngineService.evaluate(intelligence);
    expect(result.score).toBe(0);
    expect(result.riskLevel).toBe(RISK_LEVELS.LOW);
  });

  it('should apply Recency and Velocity multiplier for a spike in reports', () => {
    const now = new Date();
    // 12 reports in the last 24h
    const recentReports = Array.from({ length: 12 }).map(() => ({ createdAt: now }));
    
    const intelligence = {
      isUnknown: false,
      profile: {},
      isBlacklisted: false,
      reportStats: { total: 12, pendingCount: 0, approvedCount: 12, rejectedCount: 0 },
      approvedReports: recentReports,
      recentReports: recentReports
    };

    const result = riskEngineService.evaluate(intelligence);
    
    const verifiedSignal = result.signals.find(s => s.name === RISK_SIGNALS.VERIFIED_REPORTS);
    expect(verifiedSignal.score).toBe(45); // > 5 reports = BASE * 3 = 15 * 3 = 45

    const velocitySignal = result.signals.find(s => s.name === RISK_SIGNALS.VELOCITY);
    expect(velocitySignal.score).toBe(1.5); // Burst threshold exceeded
    
    const recencySignal = result.signals.find(s => s.name === RISK_SIGNALS.RECENCY);
    expect(recencySignal.score).toBe(1.0); // Within 24 hours

    // 45 * 1.5 * 1.0 = 67.5 -> Math.round -> 68
    expect(result.score).toBe(68);
    expect(result.riskLevel).toBe(RISK_LEVELS.MEDIUM);
  });
  
  it('should not exceed max score of 100', () => {
      const now = new Date();
      // 50 reports in the last 24h
      const recentReports = Array.from({ length: 50 }).map(() => ({ createdAt: now }));
      
      const intelligence = {
        isUnknown: false,
        profile: {},
        isBlacklisted: false,
        reportStats: { total: 50, pendingCount: 0, approvedCount: 50, rejectedCount: 0 },
        approvedReports: recentReports,
        recentReports: recentReports
      };
  
      const result = riskEngineService.evaluate(intelligence);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('should calculate confidence level correctly', () => {
    let result = riskEngineService._determineConfidence({ approvedCount: 0, pendingCount: 0, rejectedCount: 0, isBlacklisted: false });
    expect(result).toBe(CONFIDENCE_LEVELS.LOW);

    result = riskEngineService._determineConfidence({ approvedCount: 1, pendingCount: 0, rejectedCount: 0, isBlacklisted: false });
    expect(result).toBe(CONFIDENCE_LEVELS.MEDIUM);

    result = riskEngineService._determineConfidence({ approvedCount: 2, pendingCount: 3, rejectedCount: 0, isBlacklisted: false });
    expect(result).toBe(CONFIDENCE_LEVELS.HIGH);
  });
});

describe('Risk Explanation Service', () => {
  it('should generate reasons correctly', () => {
    const signals = [
      { name: RISK_SIGNALS.VERIFIED_REPORTS, description: 'Desc 1', severity: 'HIGH' },
      { name: RISK_SIGNALS.VELOCITY, description: '', severity: 'NONE' },
    ];
    
    const reasons = riskExplanationService.generateReasons(signals);
    expect(reasons.length).toBe(1);
    expect(reasons[0].title).toBe('Verified reports');
  });
});
