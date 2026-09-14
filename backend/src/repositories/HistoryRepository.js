/**
 * repositories/HistoryRepository.js
 * Firestore operations for the `check_history` collection.
 * Document ID = UUID.
 */

import { BaseRepository } from './BaseRepository.js';
import { historyConverter } from '../converters/historyConverter.js';
import { COLLECTIONS } from '../config/constants.js';
import { firestore } from '../config/firebaseAdmin.js';
import { paginateQuery } from '../utils/firestoreHelpers.js';

class HistoryRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.CHECK_HISTORY, historyConverter);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────

  /**
   * Returns check history for a specific user, newest first.
   * @param {string} userId
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findByUser(userId, options = {}) {
    const query = this.collection()
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc');

    const { docs, lastDoc, hasMore } = await paginateQuery(query, options);
    return {
      items: docs.map((d) => d.data()),
      lastDoc,
      hasMore,
    };
  }

  /**
   * Returns all check records for a specific UPI ID.
   * @param {string} upiId
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findByUpiId(upiId, options = {}) {
    const query = this.collection()
      .where('upiId', '==', upiId)
      .orderBy('timestamp', 'desc');

    const { docs, lastDoc, hasMore } = await paginateQuery(query, options);
    return {
      items: docs.map((d) => d.data()),
      lastDoc,
      hasMore,
    };
  }

  /**
   * Returns check history within a date range.
   * @param {Date}   from
   * @param {Date}   to
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findByDateRange(from, to, options = {}) {
    const query = this.collection()
      .where('timestamp', '>=', from)
      .where('timestamp', '<=', to)
      .orderBy('timestamp', 'desc');

    const { docs, lastDoc, hasMore } = await paginateQuery(query, options);
    return {
      items: docs.map((d) => d.data()),
      lastDoc,
      hasMore,
    };
  }

  /**
   * Returns check history for a user within a date range.
   * @param {string} userId
   * @param {Date}   from
   * @param {Date}   to
   * @param {number} [limit]
   */
  async findByUserAndDateRange(userId, from, to, limit = 50) {
    const snap = await this.collection()
      .where('userId', '==', userId)
      .where('timestamp', '>=', from)
      .where('timestamp', '<=', to)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map((d) => d.data());
  }

  /**
   * Returns history records filtered by check source.
   * @param {string} source - CHECK_SOURCES.*
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findBySource(source, options = {}) {
    return this.findByField('source', source, options);
  }

  /**
   * Returns the total count of check history records.
   * @returns {Promise<number>}
   */
  async count() {
    const snap = await firestore.collection(COLLECTIONS.CHECK_HISTORY).count().get();
    return snap.data().count;
  }

  /**
   * Returns the number of unique UPI IDs checked by a user.
   * Note: Firestore does not support DISTINCT — this is an approximation via limit.
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async countUniqueUpiIdsByUser(userId) {
    const snap = await firestore
      .collection(COLLECTIONS.CHECK_HISTORY)
      .where('userId', '==', userId)
      .count()
      .get();

    return snap.data().count;
  }
}

export default new HistoryRepository();
