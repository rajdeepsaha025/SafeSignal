import { FieldValue } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository.js';
import { analyticsConverter } from '../converters/analyticsConverter.js';
import { COLLECTIONS } from '../config/constants.js';
import { toDateString } from '../utils/firestoreHelpers.js';

class AnalyticsRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ANALYTICS, analyticsConverter);
  }

  _getDateId(prefix, date) {
    const id = typeof date === 'string' ? date : toDateString(date);
    return `${prefix}_${id}`;
  }

  async incrementDailyCheck(date, increments) {
    const id = this._getDateId('daily_checks', date);
    const updates = Object.fromEntries(
      Object.entries(increments).map(([k, v]) => [k, FieldValue.increment(v)])
    );
    await this.doc(id).set(
      { ...updates, date: typeof date === 'string' ? date : toDateString(date), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  async incrementDailyRisk(date, increments) {
    const id = this._getDateId('daily_risk', date);
    const updates = Object.fromEntries(
      Object.entries(increments).map(([k, v]) => [k, FieldValue.increment(v)])
    );
    await this.doc(id).set(
      { ...updates, date: typeof date === 'string' ? date : toDateString(date), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  async incrementDailyReport(date, increments) {
    const id = this._getDateId('daily_reports', date);
    const updates = Object.fromEntries(
      Object.entries(increments).map(([k, v]) => [k, FieldValue.increment(v)])
    );
    await this.doc(id).set(
      { ...updates, date: typeof date === 'string' ? date : toDateString(date), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  async incrementDailyCategory(date, category, increments) {
    const id = this._getDateId('daily_categories', date);
    const updates = Object.fromEntries(
      Object.entries(increments).map(([k, v]) => [`${category}.${k}`, FieldValue.increment(v)])
    );
    await this.doc(id).set(
      { ...updates, date: typeof date === 'string' ? date : toDateString(date), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  async incrementDailyUser(date, increments) {
    const id = this._getDateId('daily_users', date);
    const updates = Object.fromEntries(
      Object.entries(increments).map(([k, v]) => [k, FieldValue.increment(v)])
    );
    await this.doc(id).set(
      { ...updates, date: typeof date === 'string' ? date : toDateString(date), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  async incrementDashboardSummary(increments) {
    const updates = Object.fromEntries(
      Object.entries(increments).map(([k, v]) => [k, FieldValue.increment(v)])
    );
    await this.doc('dashboard_summary').set(
      { ...updates, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  async getDashboardSummary() {
    const doc = await this.findById('dashboard_summary');
    return doc || null;
  }

  async getDailyChecks(from, to) {
    return this._getDateRangeQuery('daily_checks', from, to);
  }

  async getDailyRisk(from, to) {
    return this._getDateRangeQuery('daily_risk', from, to);
  }

  async getDailyReports(from, to) {
    return this._getDateRangeQuery('daily_reports', from, to);
  }

  async getDailyCategories(from, to) {
    return this._getDateRangeQuery('daily_categories', from, to);
  }

  async getDailyUsers(from, to) {
    return this._getDateRangeQuery('daily_users', from, to);
  }

  async _getDateRangeQuery(prefix, from, to) {
    const fromId = typeof from === 'string' ? from : toDateString(from);
    const toId   = typeof to   === 'string' ? to   : toDateString(to);

    // Because document IDs are prefixed (e.g. daily_checks_YYYY-MM-DD),
    // and we also store 'date' in the document, we can query on 'date'.
    // BUT we must also filter by the document type or we might get mixed documents!
    // Since this is all in the 'analytics' collection, we can query by `__name__`.
    // Wait, `__name__` >= `prefix_fromId` and `__name__ <= prefix_toId`.
    const snap = await this.collection()
      .where('__name__', '>=', `${prefix}_${fromId}`)
      .where('__name__', '<=', `${prefix}_${toId}`)
      .get();
    
    return snap.docs.map(d => d.data());
  }

  async logEvent(event) {
    if (!event.eventId) return;
    await this.doc(`events_${event.eventId}`).set({
      ...event,
      processedAt: FieldValue.serverTimestamp()
    });
  }

  async hasEvent(eventId) {
    const doc = await this.findById(`events_${eventId}`);
    return !!doc;
  }
}

export default new AnalyticsRepository();
