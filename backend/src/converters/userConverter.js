/**
 * converters/userConverter.js
 * Firestore Data Converter for the `users` collection.
 *
 * Ensures every read/write is strongly typed and consistently shaped.
 * Use via: db.collection(COLLECTIONS.USERS).withConverter(userConverter)
 */

import { FieldValue } from 'firebase-admin/firestore';
import { ROLES, USER_STATUS } from '../config/constants.js';

/**
 * @typedef {Object} UserDocument
 * @property {string}   displayName
 * @property {string}   email
 * @property {string}   [photoURL]
 * @property {string}   role           - ROLES.*
 * @property {string}   status         - USER_STATUS.*
 * @property {Date}     createdAt
 * @property {Date}     updatedAt
 * @property {Date}     [lastLogin]
 * @property {number}   totalChecks
 * @property {number}   totalReports
 * @property {number}   deviceCount
 */

export const userConverter = {
  /**
   * Converts a UserDocument to Firestore data.
   * @param {UserDocument} user
   */
  toFirestore(user) {
    return {
      displayName:  user.displayName  ?? '',
      email:        user.email        ?? '',
      photoURL:     user.photoURL     ?? null,
      role:         user.role         ?? ROLES.USER,
      status:       user.status       ?? USER_STATUS.ACTIVE,
      createdAt:    user.createdAt    ?? FieldValue.serverTimestamp(),
      updatedAt:    FieldValue.serverTimestamp(),
      lastLogin:    user.lastLogin    ?? null,
      totalChecks:  user.totalChecks  ?? 0,
      totalReports: user.totalReports ?? 0,
      deviceCount:  user.deviceCount  ?? 0,
    };
  },

  /**
   * Converts a Firestore DocumentSnapshot to a UserDocument.
   * @param {import('firebase-admin/firestore').QueryDocumentSnapshot} snapshot
   * @returns {UserDocument & { uid: string }}
   */
  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      uid:          snapshot.id,
      displayName:  data.displayName  ?? '',
      email:        data.email        ?? '',
      photoURL:     data.photoURL     ?? null,
      role:         data.role         ?? ROLES.USER,
      status:       data.status       ?? USER_STATUS.ACTIVE,
      createdAt:    data.createdAt?.toDate() ?? null,
      updatedAt:    data.updatedAt?.toDate() ?? null,
      lastLogin:    data.lastLogin?.toDate() ?? null,
      totalChecks:  data.totalChecks  ?? 0,
      totalReports: data.totalReports ?? 0,
      deviceCount:  data.deviceCount  ?? 0,
    };
  },
};
