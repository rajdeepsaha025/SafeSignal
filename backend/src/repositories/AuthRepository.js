/**
 * repositories/AuthRepository.js
 * Firestore data access for authentication-related user operations.
 *
 * Extends UserRepository to add auth-specific methods:
 *   - findByUid (alias for findById with explicit naming)
 *   - createProfile (first-login profile creation)
 *   - updateLastLogin
 *   - updateProfile
 *
 * No business logic here — only Firestore operations.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository.js';
import { userConverter } from '../converters/userConverter.js';
import { COLLECTIONS, ROLES, USER_STATUS } from '../config/constants.js';

class AuthRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.USERS, userConverter);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────

  /**
   * Finds a user profile by Firebase UID.
   * Returns null if no Firestore profile exists yet.
   *
   * @param {string} uid - Firebase UID
   * @returns {Promise<object|null>}
   */
  async findByUid(uid) {
    return this.findById(uid);
  }

  /**
   * Checks whether a Firestore profile exists for the given UID.
   * @param {string} uid
   * @returns {Promise<boolean>}
   */
  async profileExists(uid) {
    return this.exists(uid);
  }

  // ─── Writes ──────────────────────────────────────────────────────────────────

  /**
   * Creates a new Firestore user profile on first login.
   * The document ID is the Firebase UID.
   *
   * @param {string} uid
   * @param {object} data
   * @param {string} data.email
   * @param {string} [data.displayName]
   * @param {string} [data.photoURL]
   * @returns {Promise<{ id: string }>}
   */
  async createProfile(uid, { email, displayName = '', photoURL = null }) {
    const now = FieldValue.serverTimestamp();

    await this.doc(uid).set({
      uid,
      email,
      displayName: displayName ?? '',
      photoURL:    photoURL    ?? null,
      role:        ROLES.USER,
      status:      USER_STATUS.ACTIVE,
      createdAt:   now,
      updatedAt:   now,
      lastLogin:   now,
      totalChecks:  0,
      totalReports: 0,
      deviceCount:  0,
    });

    return { id: uid };
  }

  /**
   * Records a login — updates lastLogin and updatedAt timestamps.
   * @param {string} uid
   */
  async updateLastLogin(uid) {
    await this.doc(uid).update({
      lastLogin: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Updates mutable profile fields (displayName, photoURL).
   * Role and status are NEVER updated from here — use UserRepository for that.
   *
   * @param {string} uid
   * @param {object} data
   * @param {string} [data.displayName]
   * @param {string} [data.photoURL]
   */
  async updateProfile(uid, { displayName, photoURL } = {}) {
    const updates = { updatedAt: FieldValue.serverTimestamp() };
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL    !== undefined) updates.photoURL    = photoURL;

    await this.doc(uid).update(updates);
  }

  /**
   * Upserts a Firestore profile — creates if not exists, merges if exists.
   * Safe for repeated calls on every login (idempotent).
   *
   * @param {string} uid
   * @param {object} firebaseUser - Decoded Firebase token fields
   * @returns {Promise<object>} - The current Firestore profile
   */
  async syncProfile(uid, firebaseUser) {
    const existing = await this.findByUid(uid);

    if (!existing) {
      await this.createProfile(uid, {
        email:       firebaseUser.email       ?? '',
        displayName: firebaseUser.name        ?? firebaseUser.email?.split('@')[0] ?? '',
        photoURL:    firebaseUser.picture     ?? null,
      });
    } else {
      await this.updateLastLogin(uid);
    }

    // Always return the fresh profile from Firestore
    return this.findByUid(uid);
  }
}

export default new AuthRepository();
