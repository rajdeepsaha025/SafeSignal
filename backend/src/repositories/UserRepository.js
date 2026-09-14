/**
 * repositories/UserRepository.js
 * Firestore operations for the `users` collection.
 * Document ID = Firebase UID.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository.js';
import { userConverter } from '../converters/userConverter.js';
import { COLLECTIONS, ROLES, USER_STATUS } from '../config/constants.js';
import { firestore } from '../config/firebaseAdmin.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.USERS, userConverter);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────

  /**
   * Finds a user by email address.
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const snap = await this.collection()
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snap.empty) return null;
    return snap.docs[0].data();
  }

  /**
   * Returns all users with a specific role.
   * @param {string} role  - ROLES.*
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findByRole(role, options = {}) {
    return this.findByField('role', role, options);
  }

  /**
   * Returns all active users (paginated).
   * @param {{ limit?: number, startAfter?: any }} [options]
   */
  async findActive(options = {}) {
    return this.findByField('status', USER_STATUS.ACTIVE, options);
  }

  /**
   * Returns all blocked users.
   */
  async findBlocked(options = {}) {
    return this.findByField('status', USER_STATUS.BLOCKED, options);
  }

  // ─── Writes ──────────────────────────────────────────────────────────────────

  /**
   * Creates or updates a user document (upsert).
   * Used on first login via Firebase Auth.
   *
   * @param {string} uid
   * @param {object} data
   */
  async upsert(uid, data) {
    const ref = this.doc(uid);
    await ref.set(
      {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { id: uid };
  }

  /**
   * Records a login — updates lastLogin timestamp.
   * @param {string} uid
   */
  async recordLogin(uid) {
    await this.doc(uid).update({
      lastLogin: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Blocks a user account.
   * @param {string} uid
   */
  async blockUser(uid) {
    await this.update(uid, { status: USER_STATUS.BLOCKED });
  }

  /**
   * Restores a blocked user.
   * @param {string} uid
   */
  async unblockUser(uid) {
    await this.update(uid, { status: USER_STATUS.ACTIVE });
  }

  /**
   * Promotes a user to a new role.
   * @param {string} uid
   * @param {string} role - ROLES.*
   */
  async setRole(uid, role) {
    await this.update(uid, { role });
  }

  /**
   * Returns users created within the last N days.
   * @param {number} days
   * @param {number} [limit]
   */
  async findRecentUsers(days = 7, limit = 50) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const snap = await this.collection()
      .where('createdAt', '>=', cutoff)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map((d) => d.data());
  }

  /**
   * Returns aggregated user role counts.
   * Note: Firestore does not support COUNT natively in Admin SDK.
   * This loads all users per role — use only for admin dashboards.
   */
  async getRoleCounts() {
    const [admins, moderators, users] = await Promise.all([
      firestore.collection(COLLECTIONS.USERS).where('role', '==', ROLES.ADMIN).count().get(),
      firestore.collection(COLLECTIONS.USERS).where('role', '==', ROLES.MODERATOR).count().get(),
      firestore.collection(COLLECTIONS.USERS).where('role', '==', ROLES.USER).count().get(),
    ]);

    return {
      admins:     admins.data().count,
      moderators: moderators.data().count,
      users:      users.data().count,
    };
  }
}

export default new UserRepository();
