import AnalyticsRepository from '../../repositories/AnalyticsRepository.js';
import { toDateString } from '../../utils/firestoreHelpers.js';

class AnalyticsService {
  /**
   * Helper to execute a block idempotently.
   */
  async _runIdempotent(eventId, eventType, dateStr, block) {
    if (!eventId) {
      await block();
      return;
    }
    const hasEvent = await AnalyticsRepository.hasEvent(eventId);
    if (hasEvent) return; // duplicate
    
    await block();

    await AnalyticsRepository.logEvent({
      eventId,
      eventType,
      date: dateStr
    });
  }

  async recordCheck(checkEventId, result) {
    const today = toDateString(new Date());
    await this._runIdempotent(checkEventId, 'UPI_CHECK', today, async () => {
      // 1. increment daily checks
      const checksInc = { totalChecks: 1 };
      const riskInc = { total: 1 };
      
      // Determine what to increment based on risk level
      if (result.riskLevel === 'HIGH') {
        checksInc.highRiskChecks = 1;
        riskInc.high = 1;
      } else if (result.riskLevel === 'MEDIUM') {
        checksInc.mediumRiskChecks = 1;
        riskInc.medium = 1;
      } else {
        checksInc.lowRiskChecks = 1;
        riskInc.low = 1;
      }

      if (result.isBlacklisted) {
        checksInc.blacklistedChecks = 1;
        riskInc.blacklisted = 1;
      }

      // 2. We can't perfectly track uniqueness without scan or large bloom filter,
      // so for MVP we just increment a raw counter or skip. The prompt allows approximate uniqueness or trade-off docs.
      // We will skip exact unique check counting.
      
      await AnalyticsRepository.incrementDailyCheck(today, checksInc);
      await AnalyticsRepository.incrementDailyRisk(today, riskInc);
      
      // 3. update dashboard summary
      await AnalyticsRepository.incrementDashboardSummary({ totalChecks: 1 });
    });
  }

  async recordReportSubmitted(reportId, category) {
    const today = toDateString(new Date());
    await this._runIdempotent(`report_submit_${reportId}`, 'REPORT_SUBMITTED', today, async () => {
      await AnalyticsRepository.incrementDailyReport(today, { totalReports: 1, pendingReports: 1 });
      await AnalyticsRepository.incrementDailyCategory(today, category || 'OTHER', { submitted: 1, pending: 1 });
      await AnalyticsRepository.incrementDashboardSummary({ totalReports: 1, pendingReports: 1 });
    });
  }

  async recordReportApproved(reportId, category) {
    const today = toDateString(new Date());
    await this._runIdempotent(`report_approve_${reportId}`, 'REPORT_APPROVED', today, async () => {
      await AnalyticsRepository.incrementDailyReport(today, { pendingReports: -1, approvedReports: 1 });
      await AnalyticsRepository.incrementDailyCategory(today, category || 'OTHER', { pending: -1, approved: 1 });
      await AnalyticsRepository.incrementDashboardSummary({ pendingReports: -1, approvedReports: 1 });
    });
  }

  async recordReportRejected(reportId, category) {
    const today = toDateString(new Date());
    await this._runIdempotent(`report_reject_${reportId}`, 'REPORT_REJECTED', today, async () => {
      await AnalyticsRepository.incrementDailyReport(today, { pendingReports: -1, rejectedReports: 1 });
      await AnalyticsRepository.incrementDailyCategory(today, category || 'OTHER', { pending: -1, rejected: 1 });
      await AnalyticsRepository.incrementDashboardSummary({ pendingReports: -1, rejectedReports: 1 });
    });
  }

  async recordUserCreated(userId) {
    const today = toDateString(new Date());
    await this._runIdempotent(`user_create_${userId}`, 'USER_CREATED', today, async () => {
      await AnalyticsRepository.incrementDailyUser(today, { newUsers: 1 });
      await AnalyticsRepository.incrementDashboardSummary({ totalUsers: 1 });
    });
  }

  async recordUserActivity(userId, _activityType) {
    const today = toDateString(new Date());
    // We only want to count active user once per day. Idempotency key:
    const eventId = `user_active_${userId}_${today}`;
    await this._runIdempotent(eventId, 'USER_ACTIVE', today, async () => {
      await AnalyticsRepository.incrementDailyUser(today, { activeUsers: 1 });
    });
  }

  async recordBlacklistChange(upiId, action) {
    const today = toDateString(new Date());
    const eventId = `blacklist_${action}_${upiId}_${today}_${Date.now()}`;
    await this._runIdempotent(eventId, action === 'BLACKLIST' ? 'UPI_BLACKLISTED' : 'UPI_UNBLACKLISTED', today, async () => {
      if (action === 'BLACKLIST') {
        await AnalyticsRepository.incrementDashboardSummary({ blacklistedProfiles: 1 });
      } else {
        await AnalyticsRepository.incrementDashboardSummary({ blacklistedProfiles: -1 });
      }
    });
  }

  // --- Read Methods ---

  _getDatesList(days) {
    const dates = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dates.push(toDateString(d));
    }
    return dates;
  }

  _fillMissingDates(datesList, dataMap, defaultObj) {
    return datesList.map(date => {
      if (dataMap[date]) return { date, ...dataMap[date] };
      return { date, ...defaultObj };
    });
  }

  _getRangeDates(range) {
    const days = range === '30d' ? 30 : (range === '7d' ? 7 : 1);
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    return { from, to, days };
  }

  async getOverview() {
    const summary = await AnalyticsRepository.getDashboardSummary() || {};
    
    // Get today's stats to return in `today` block
    const today = toDateString(new Date());
    const [checks, reports] = await Promise.all([
      AnalyticsRepository.getDailyChecks(today, today),
      AnalyticsRepository.getDailyReports(today, today)
    ]);

    const todayChecks = checks[0] || {};
    const todayReports = reports[0] || {};

    return {
      summary: {
        totalUsers: summary.totalUsers || 0,
        totalUpiProfiles: summary.totalUpiProfiles || 0, // Hard to track perfectly without sync
        totalReports: summary.totalReports || 0,
        pendingReports: summary.pendingReports || 0,
        approvedReports: summary.approvedReports || 0,
        rejectedReports: summary.rejectedReports || 0,
        totalChecks: summary.totalChecks || 0,
        highRiskProfiles: summary.highRiskProfiles || 0,
        blacklistedProfiles: summary.blacklistedProfiles || 0
      },
      today: {
        checks: todayChecks.totalChecks || 0,
        highRiskChecks: todayChecks.highRiskChecks || 0,
        reports: todayReports.totalReports || 0
      },
      updatedAt: summary.updatedAt || new Date().toISOString()
    };
  }

  async getCheckAnalytics(range = '7d') {
    const { from, to, days } = this._getRangeDates(range);
    const results = await AnalyticsRepository.getDailyChecks(from, to);
    
    const dataMap = {};
    results.forEach(r => { dataMap[r.date] = r; });

    const datesList = this._getDatesList(days);
    const series = this._fillMissingDates(datesList, dataMap, {
      totalChecks: 0,
      lowRiskChecks: 0,
      mediumRiskChecks: 0,
      highRiskChecks: 0,
      blacklistedChecks: 0
    });

    return { range, series: series.map(s => ({
      date: s.date,
      total: s.totalChecks || 0,
      low: s.lowRiskChecks || 0,
      medium: s.mediumRiskChecks || 0,
      high: s.highRiskChecks || 0,
      blacklisted: s.blacklistedChecks || 0
    }))};
  }

  async getRiskAnalytics(range = '7d') {
    const { from, to, days } = this._getRangeDates(range);
    const results = await AnalyticsRepository.getDailyRisk(from, to);

    const dataMap = {};
    results.forEach(r => { dataMap[r.date] = r; });
    const datesList = this._getDatesList(days);
    const series = this._fillMissingDates(datesList, dataMap, {
      total: 0, low: 0, medium: 0, high: 0, blacklisted: 0
    });

    return { range, series: series.map(s => ({
      date: s.date,
      total: s.total || 0,
      low: s.low || 0,
      medium: s.medium || 0,
      high: s.high || 0,
      blacklisted: s.blacklisted || 0
    }))};
  }

  async getCategoryAnalytics(range = '30d') {
    const { from, to } = this._getRangeDates(range);
    const results = await AnalyticsRepository.getDailyCategories(from, to);

    const aggregate = {};
    results.forEach(r => {
      Object.keys(r).forEach(key => {
        if (key === 'date' || key === 'updatedAt') return;
        if (!aggregate[key]) {
          aggregate[key] = { submitted: 0, approved: 0, rejected: 0, pending: 0 };
        }
        aggregate[key].submitted += (r[key].submitted || 0);
        aggregate[key].approved += (r[key].approved || 0);
        aggregate[key].rejected += (r[key].rejected || 0);
        aggregate[key].pending += (r[key].pending || 0); // Not completely accurate as pending is a snapshot, but it's ok for MVP totals if we track daily changes
      });
    });

    const categories = Object.keys(aggregate).map(cat => ({
      category: cat,
      ...aggregate[cat]
    }));

    return { range, categories };
  }

  async getModerationAnalytics(range = '7d') {
    const { from, to, days } = this._getRangeDates(range);
    const results = await AnalyticsRepository.getDailyReports(from, to);

    let submitted = 0, approved = 0, rejected = 0, pending = 0;
    
    const dataMap = {};
    results.forEach(r => { 
      dataMap[r.date] = r; 
      submitted += (r.totalReports || 0);
      approved += (r.approvedReports || 0);
      rejected += (r.rejectedReports || 0);
      pending += (r.pendingReports || 0);
    });

    const datesList = this._getDatesList(days);
    const series = this._fillMissingDates(datesList, dataMap, {
      totalReports: 0, approvedReports: 0, rejectedReports: 0, pendingReports: 0
    });

    const totalResolved = approved + rejected;
    const approvalRate = totalResolved > 0 ? (approved / totalResolved) * 100 : 0;
    const rejectionRate = totalResolved > 0 ? (rejected / totalResolved) * 100 : 0;

    return { 
      range, 
      submitted, 
      approved, 
      rejected, 
      pending,
      approvalRate,
      rejectionRate,
      series 
    };
  }

  async getUserAnalytics(range = '30d') {
    const { from, to, days } = this._getRangeDates(range);
    const results = await AnalyticsRepository.getDailyUsers(from, to);

    const dataMap = {};
    let newUsers = 0, activeUsersTotal = 0;
    results.forEach(r => { 
      dataMap[r.date] = r; 
      newUsers += (r.newUsers || 0);
      // 'activeUsers' is inherently daily, summing it up over days just gives "total active user days"
      activeUsersTotal += (r.activeUsers || 0);
    });

    const datesList = this._getDatesList(days);
    const series = this._fillMissingDates(datesList, dataMap, {
      newUsers: 0, activeUsers: 0
    });

    return {
      range,
      newUsers,
      totalActiveUserDays: activeUsersTotal,
      series
    };
  }
}

export default new AnalyticsService();
