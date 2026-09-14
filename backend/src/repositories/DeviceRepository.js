/**
 * repositories/DeviceRepository.js
 * Firestore operations for the `device_reputation` collection.
 * Document ID = device hash (SHA-256 of device fingerprint).
 */

import { FieldValue } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/constants.js';
import { firestore } from '../config/firebaseAdmin.js';

class DeviceRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.DEVICE_REPUTATION);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────

  /**
   * Returns a device reputation record by its hash.
   * @param {string} deviceHash
   * @returns {Promise<object|null>}
   */
  async findByHash(deviceHash) {
    return this.findById(deviceHash);
  }

  /**
   * Returns devices with a trust score below a threshold (low-trust devices).
   * @param {number} maxScore
   * @param {number} [limit]
   */
  async findLowTrust(maxScore = 30, limit = 50) {
    const snap = await this.collection()
      .where('trustScore', '<=', maxScore)
      .orderBy('trustScore', 'asc')
      .limit(limit)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  /**
   * Returns devices that have submitted the most false reports.
   * @param {number} [limit]
   */
  async findMostAbusive(limit = 20) {
    const snap = await this.collection()
      .orderBy('falseReports', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // ─── Writes ──────────────────────────────────────────────────────────────────

  /**
   * Creates or updates a device reputation document (upsert).
   * @param {string} deviceHash
   * @param {object} data
   */
  async upsert(deviceHash, data) {
    await this.doc(deviceHash).set(
      {
        deviceHash,
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { id: deviceHash };
  }

  /**
   * Records a successful (legitimate) report submission from a device.
   * Increments reportsSubmitted and successfulReports; adjusts trust score up.
   * @param {string} deviceHash
   */
  async recordSuccessfulReport(deviceHash) {
    await this.doc(deviceHash).set(
      {
        deviceHash,
        reportsSubmitted:   FieldValue.increment(1),
        successfulReports:  FieldValue.increment(1),
        trustScore:         FieldValue.increment(2), // Boost trust
        updatedAt:          FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Records a false/rejected report from a device.
   * Increments reportsSubmitted and falseReports; penalises trust score.
   * @param {string} deviceHash
   */
  async recordFalseReport(deviceHash) {
    await this.doc(deviceHash).set(
      {
        deviceHash,
        reportsSubmitted: FieldValue.increment(1),
        falseReports:     FieldValue.increment(1),
        trustScore:       FieldValue.increment(-5), // Penalise trust
        updatedAt:        FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Returns the total count of tracked devices.
   * @returns {Promise<number>}
   */
  async count() {
    const snap = await firestore.collection(COLLECTIONS.DEVICE_REPUTATION).count().get();
    return snap.data().count;
  }
}

export default new DeviceRepository();
