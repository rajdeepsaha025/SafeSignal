import { describe, it, expect, vi, beforeEach } from 'vitest';
import analyticsService from '../src/services/analytics/AnalyticsService.js';
import AnalyticsRepository from '../src/repositories/AnalyticsRepository.js';

vi.mock('../src/repositories/AnalyticsRepository.js', () => ({
  default: {
    incrementDailyCheck: vi.fn(),
    incrementDailyRisk: vi.fn(),
    incrementDashboardSummary: vi.fn(),
    incrementDailyReport: vi.fn(),
    incrementDailyCategory: vi.fn(),
    incrementDailyUser: vi.fn(),
    logEvent: vi.fn(),
    hasEvent: vi.fn().mockResolvedValue(false),
    getDailyChecks: vi.fn().mockResolvedValue([]),
    getDailyRisk: vi.fn().mockResolvedValue([]),
    getDailyReports: vi.fn().mockResolvedValue([]),
    getDailyCategories: vi.fn().mockResolvedValue([]),
    getDailyUsers: vi.fn().mockResolvedValue([]),
    getDashboardSummary: vi.fn().mockResolvedValue({}),
  }
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increments daily check counter for low risk', async () => {
    await analyticsService.recordCheck('check1', { riskLevel: 'LOW', isBlacklisted: false });
    expect(AnalyticsRepository.incrementDailyCheck).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ totalChecks: 1, lowRiskChecks: 1 })
    );
  });

  it('increments high risk and blacklist correctly', async () => {
    await analyticsService.recordCheck('check2', { riskLevel: 'HIGH', isBlacklisted: true });
    expect(AnalyticsRepository.incrementDailyCheck).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ totalChecks: 1, highRiskChecks: 1, blacklistedChecks: 1 })
    );
  });

  it('handles duplicate events idempotently', async () => {
    AnalyticsRepository.hasEvent.mockResolvedValueOnce(true);
    await analyticsService.recordCheck('check1', { riskLevel: 'LOW' });
    expect(AnalyticsRepository.incrementDailyCheck).not.toHaveBeenCalled();
  });

  it('increments report counts on submission', async () => {
    await analyticsService.recordReportSubmitted('rep1', 'QR_SCAM');
    expect(AnalyticsRepository.incrementDailyReport).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ totalReports: 1, pendingReports: 1 })
    );
    expect(AnalyticsRepository.incrementDailyCategory).toHaveBeenCalledWith(
      expect.any(String),
      'QR_SCAM',
      expect.objectContaining({ submitted: 1 })
    );
  });

  it('returns zeros for missing dates in 7d series', async () => {
    const result = await analyticsService.getCheckAnalytics('7d');
    expect(result.series.length).toBe(7);
    expect(result.series[0].total).toBe(0);
  });
});
