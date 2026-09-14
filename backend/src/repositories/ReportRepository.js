/**
 * repositories/ReportRepository.js
 * Firestore operations for the `reports` collection.
 * Document ID = UUID.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository.js';
import { reportConverter } from '../converters/reportConverter.js';
import { COLLECTIONS, REPORT_STATUS } from '../config/constants.js';
import { firestore } from '../config/firebaseAdmin.js';
import { paginateQuery } from '../utils/firestoreHelpers.js';

class ReportRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.REPORTS, reportConverter);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────

  /**
   * Returns all reports for a specific UPI ID.
   * @param {string} upiId
   * @param {{ limit?: number, startAfter?: any, status?: string }} [options]
   */
  async findByUpiId(upiId, { limit, startAfter, status } = {}) {
    let query = this.collection()
      .where('upiId', '==', upiId)
      .orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);

    const { docs, lastDoc, hasMore } = await paginateQuery(query, { limit, startAfter });
    return {
      items: docs.map((d) => d.data()),
      lastDoc,
      hasMore,
    };
  }

  /**
   * Returns all reports submitted by a specific user.
   * @param {string} uid
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findByReporter(uid, options = {}) {
    const query = this.collection()
      .where('reporterUid', '==', uid)
      .orderBy('createdAt', 'desc');

    const { docs, lastDoc, hasMore } = await paginateQuery(query, options);
    return {
      items: docs.map((d) => d.data()),
      lastDoc,
      hasMore,
    };
  }

  /**
   * Returns reports filtered by status.
   * @param {string} status - REPORT_STATUS.*
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findByStatus(status, options = {}) {
    const query = this.collection()
      .where('status', '==', status)
      .orderBy('createdAt', 'desc');

    const { docs, lastDoc, hasMore } = await paginateQuery(query, options);
    return {
      items: docs.map((d) => d.data()),
      lastDoc,
      hasMore,
    };
  }

  /**
   * Returns all PENDING reports awaiting moderation.
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findPending(options = {}) {
    return this.findByStatus(REPORT_STATUS.PENDING, options);
  }

  /**
   * Returns reports filtered by fraud type.
   * @param {string} fraudType
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findByFraudType(fraudType, options = {}) {
    return this.findByField('fraudType', fraudType, options);
  }

  /**
   * Returns reports moderated by a specific moderator.
   * @param {string} moderatorUid
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findByModerator(moderatorUid, options = {}) {
    return this.findByField('moderatedBy', moderatorUid, options);
  }

  /**
   * Checks whether a user has already filed a report against a specific UPI ID.
   * @param {string} upiId
   * @param {string} uid
   * @returns {Promise<boolean>}
   */
  async hasUserReported(upiId, uid) {
    const snap = await firestore
      .collection(COLLECTIONS.REPORTS)
      .where('upiId', '==', upiId)
      .where('reporterUid', '==', uid)
      .limit(1)
      .get();

    return !snap.empty;
  }

  /**
   * Counts reports per status for a given UPI ID.
   * @param {string} upiId
   * @returns {Promise<{ pending: number, approved: number, rejected: number }>}
   */
  async countByStatus(upiId) {
    const [pending, approved, rejected] = await Promise.all([
      firestore.collection(COLLECTIONS.REPORTS)
        .where('upiId', '==', upiId)
        .where('status', '==', REPORT_STATUS.PENDING)
        .count().get(),
      firestore.collection(COLLECTIONS.REPORTS)
        .where('upiId', '==', upiId)
        .where('status', '==', REPORT_STATUS.APPROVED)
        .count().get(),
      firestore.collection(COLLECTIONS.REPORTS)
        .where('upiId', '==', upiId)
        .where('status', '==', REPORT_STATUS.REJECTED)
        .count().get(),
    ]);

    return {
      pending:  pending.data().count,
      approved: approved.data().count,
      rejected: rejected.data().count,
    };
  }

  // ─── Writes ──────────────────────────────────────────────────────────────────

  /**
   * Approves a report and records the moderator.
   * @param {string} reportId
   * @param {string} moderatorUid
   */
  async approve(reportId, moderatorUid) {
    await this.update(reportId, {
      status:      REPORT_STATUS.APPROVED,
      moderatedBy: moderatorUid,
      moderatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Rejects a report and records the moderator.
   * @param {string} reportId
   * @param {string} moderatorUid
   */
  async reject(reportId, moderatorUid) {
    await this.update(reportId, {
      status:      REPORT_STATUS.REJECTED,
      moderatedBy: moderatorUid,
      moderatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Adds an evidence URL to a report.
   * @param {string}   reportId
   * @param {string}   evidenceUrl
   */
  async addEvidence(reportId, evidenceUrl) {
    await this.doc(reportId).update({
      evidenceUrls: FieldValue.arrayUnion(evidenceUrl),
      updatedAt:    FieldValue.serverTimestamp(),
    });
  }

  /**
   * Returns the total count of reports.
   * @returns {Promise<number>}
   */
  async count() {
    const snap = await firestore.collection(COLLECTIONS.REPORTS).count().get();
    return snap.data().count;
  }
}

export default new ReportRepository();
