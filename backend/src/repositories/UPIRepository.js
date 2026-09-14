/**
 * repositories/UPIRepository.js
 * Firestore operations for the `upi_profiles` collection.
 * Document ID = UPI ID string (e.g., "merchant@oksbi").
 */

import { FieldValue } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository.js';
import { upiProfileConverter } from '../converters/upiProfileConverter.js';
import { COLLECTIONS, RISK_LEVELS } from '../config/constants.js';
import { firestore } from '../config/firebaseAdmin.js';

class UPIRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.UPI_PROFILES, upiProfileConverter);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────

  /**
   * Finds a UPI profile by UPI ID.
   * The document ID IS the UPI ID.
   * @param {string} upiId
   * @returns {Promise<object|null>}
   */
  async findByUpiId(upiId) {
    return this.findById(upiId.toLowerCase().trim());
  }

  /**
   * Returns all blacklisted UPI profiles.
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findBlacklisted(options = {}) {
    return this.findByField('isBlacklisted', true, options);
  }

  /**
   * Returns profiles above a given risk score threshold.
   * @param {number} minScore
   * @param {number} [limit]
   * @param {any}    [startAfter]
   */
  async findHighRisk(minScore = 70, limit = 20, startAfter = null) {
    const { paginateQuery } = await import('../utils/firestoreHelpers.js');
    const query = this.collection()
      .where('riskScore', '>=', minScore)
      .orderBy('riskScore', 'desc');

    const { docs, lastDoc, hasMore } = await paginateQuery(query, { limit, startAfter });
    return {
      items: docs.map((d) => d.data()),
      lastDoc,
      hasMore,
    };
  }

  /**
   * Returns profiles with a specific risk level.
   * @param {string} riskLevel - RISK_LEVELS.*
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findByRiskLevel(riskLevel, options = {}) {
    return this.findByField('riskLevel', riskLevel, options);
  }

  /**
   * Returns the top N most-reported UPI profiles.
   * @param {number} [limit]
   */
  async findMostReported(limit = 10) {
    const snap = await this.collection()
      .orderBy('verifiedReports', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map((d) => d.data());
  }

  /**
   * Searches UPI profiles by prefix (for autocomplete).
   * Firestore does not support full-text search — use Algolia/Typesense for that.
   * This is a simple range query on the UPI ID.
   *
   * @param {string} prefix
   * @param {number} [limit]
   */
  async searchByPrefix(prefix, limit = 10) {
    const end = prefix + '\uf8ff';
    const snap = await this.collection()
      .where('upiId', '>=', prefix)
      .where('upiId', '<=', end)
      .limit(limit)
      .get();

    return snap.docs.map((d) => d.data());
  }

  // ─── Writes ──────────────────────────────────────────────────────────────────

  /**
   * Creates or updates a UPI profile (upsert).
   * @param {string} upiId
   * @param {object} data
   */
  async upsert(upiId, data) {
    const id = upiId.toLowerCase().trim();
    await this.doc(id).set(
      { ...data, upiId: id, lastUpdated: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { id };
  }

  /**
   * Increments the totalChecks counter and updates lastChecked.
   * @param {string} upiId
   */
  async recordCheck(upiId) {
    const id = upiId.toLowerCase().trim();
    await this.doc(id).update({
      totalChecks: FieldValue.increment(1),
      lastChecked: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Blacklists a UPI profile.
   * @param {string} upiId
   */
  async blacklist(upiId) {
    await this.update(upiId.toLowerCase().trim(), { isBlacklisted: true });
  }

  /**
   * Removes a UPI profile from the blacklist.
   * @param {string} upiId
   */
  async unblacklist(upiId) {
    await this.update(upiId.toLowerCase().trim(), { isBlacklisted: false });
  }

  /**
   * Updates the risk score and derived level atomically.
   * @param {string} upiId
   * @param {number} riskScore  - 0–100
   * @param {string} riskLevel  - RISK_LEVELS.*
   * @param {string[]} riskReasons
   */
  async updateRiskScore(upiId, riskScore, riskLevel, riskReasons = []) {
    await this.update(upiId.toLowerCase().trim(), {
      riskScore,
      riskLevel,
      riskReasons,
      lastUpdated: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Returns the total count of UPI profiles.
   * @returns {Promise<number>}
   */
  async count() {
    const snap = await firestore.collection(COLLECTIONS.UPI_PROFILES).count().get();
    return snap.data().count;
  }
}

export default new UPIRepository();
