/**
 * converters/analyticsConverter.js
 * Firestore Data Converter for the `analytics` collection.
 * Document ID convention: YYYY-MM-DD (ISO date string)
 */

import { FieldValue } from 'firebase-admin/firestore';

/**
 * @typedef {Object} AnalyticsDocument
 * @property {string} date         - YYYY-MM-DD
 * @property {number} totalChecks
 * @property {number} highRisk
 * @property {number} mediumRisk
 * @property {number} lowRisk
 * @property {number} reports
 * @property {number} newUsers
 * @property {Date}   updatedAt
 */

export const analyticsConverter = {
  toFirestore(analytics) {
    return {
      date:        analytics.date,
      totalChecks: analytics.totalChecks ?? 0,
      highRisk:    analytics.highRisk    ?? 0,
      mediumRisk:  analytics.mediumRisk  ?? 0,
      lowRisk:     analytics.lowRisk     ?? 0,
      reports:     analytics.reports     ?? 0,
      newUsers:    analytics.newUsers    ?? 0,
      updatedAt:   FieldValue.serverTimestamp(),
    };
  },

  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      date:        snapshot.id,
      totalChecks: data.totalChecks ?? 0,
      highRisk:    data.highRisk    ?? 0,
      mediumRisk:  data.mediumRisk  ?? 0,
      lowRisk:     data.lowRisk     ?? 0,
      reports:     data.reports     ?? 0,
      newUsers:    data.newUsers    ?? 0,
      updatedAt:   data.updatedAt?.toDate() ?? null,
    };
  },
};
