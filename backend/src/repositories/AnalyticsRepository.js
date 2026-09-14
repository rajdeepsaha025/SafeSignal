/**
 * repositories/AnalyticsRepository.js
 * Firestore operations for the `analytics` collection.
 * Document ID = YYYY-MM-DD (ISO date string, UTC).
 */

import { FieldValue } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository.js';
import { analyticsConverter } from '../converters/analyticsConverter.js';
import { COLLECTIONS } from '../config/constants.js';
import { toDateString } from '../utils/firestoreHelpers.js';

class AnalyticsRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ANALYTICS, analyticsConverter);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────

  /**
   * Returns analytics for a specific date.
   * @param {Date|string} date  - JS Date or 'YYYY-MM-DD' string
   * @returns {Promise<object|null>}
   */
  async findByDate(date) {
    const id = typeof date === 'string' ? date : toDateString(date);
    return this.findById(id);
  }

  /**
   * Returns analytics for a date range (inclusive).
   * @param {Date|string} from
   * @param {Date|string} to
   * @returns {Promise<object[]>}
   */
  async findByDateRange(from, to) {
    const fromId = typeof from === 'string' ? from : toDateString(from);
    const toId   = typeof to   === 'string' ? to   : toDateString(to);

    const snap = await this.collection()
      .where('date', '>=', fromId)
      .where('date', '<=', toId)
      .orderBy('date', 'asc')
      .get();

    return snap.docs.map((d) => d.data());
  }

  /**
   * Returns analytics for the last N days.
   * @param {number} days
   * @returns {Promise<object[]>}
   */
  async findLastNDays(days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.findByDateRange(from, new Date());
  }

  /**
   * Returns the most recent analytics document.
   * @returns {Promise<object|null>}
   */
  async findLatest() {
    const snap = await this.collection()
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snap.empty) return null;
    return snap.docs[0].data();
  }

  // ─── Writes ──────────────────────────────────────────────────────────────────

  /**
   * Creates or updates the analytics document for a given date.
   * Uses merge so partial updates are safe.
   *
   * @param {Date|string} date
   * @param {object}      data
   */
  async upsertForDate(date, data) {
    const id = typeof date === 'string' ? date : toDateString(date);
    await this.doc(id).set(
      { ...data, date: id, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { id };
  }

  /**
   * Atomically increments counter fields for today's analytics document.
   * Creates the document if it does not exist (via merge).
   *
   * @param {object} increments  - e.g. { totalChecks: 1, highRisk: 1 }
   */
  async incrementToday(increments) {
    const today = toDateString(new Date());
    const updates = Object.fromEntries(
      Object.entries(increments).map(([k, v]) => [k, FieldValue.increment(v)])
    );

    await this.doc(today).set(
      { ...updates, date: today, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
}

export default new AnalyticsRepository();
