/**
 * converters/upiProfileConverter.js
 * Firestore Data Converter for the `upi_profiles` collection.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { RISK_LEVELS } from '../config/constants.js';

/**
 * @typedef {Object} UPIProfileDocument
 * @property {string}   upiId
 * @property {number}   riskScore          - 0–100
 * @property {string}   riskLevel          - RISK_LEVELS.*
 * @property {number}   communityScore     - 0–100 crowd-sourced score
 * @property {number}   mlProbability      - 0–1 ML fraud probability
 * @property {number}   verifiedReports
 * @property {number}   pendingReports
 * @property {number}   rejectedReports
 * @property {number}   totalChecks
 * @property {Date}     [lastReported]
 * @property {Date}     [lastChecked]
 * @property {Date}     lastUpdated
 * @property {string[]} fraudCategories
 * @property {string[]} riskReasons
 * @property {boolean}  isBlacklisted
 */

export const upiProfileConverter = {
  toFirestore(profile) {
    return {
      upiId:            profile.upiId,
      riskScore:        profile.riskScore        ?? 0,
      riskLevel:        profile.riskLevel        ?? RISK_LEVELS.LOW,
      communityScore:   profile.communityScore   ?? 0,
      mlProbability:    profile.mlProbability    ?? 0,
      verifiedReports:  profile.verifiedReports  ?? 0,
      pendingReports:   profile.pendingReports   ?? 0,
      rejectedReports:  profile.rejectedReports  ?? 0,
      totalChecks:      profile.totalChecks      ?? 0,
      lastReported:     profile.lastReported     ?? null,
      lastChecked:      profile.lastChecked      ?? null,
      lastUpdated:      FieldValue.serverTimestamp(),
      fraudCategories:  profile.fraudCategories  ?? [],
      riskReasons:      profile.riskReasons      ?? [],
      isBlacklisted:    profile.isBlacklisted     ?? false,
    };
  },

  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      upiId:            snapshot.id,
      riskScore:        data.riskScore        ?? 0,
      riskLevel:        data.riskLevel        ?? RISK_LEVELS.LOW,
      communityScore:   data.communityScore   ?? 0,
      mlProbability:    data.mlProbability    ?? 0,
      verifiedReports:  data.verifiedReports  ?? 0,
      pendingReports:   data.pendingReports   ?? 0,
      rejectedReports:  data.rejectedReports  ?? 0,
      totalChecks:      data.totalChecks      ?? 0,
      lastReported:     data.lastReported?.toDate()  ?? null,
      lastChecked:      data.lastChecked?.toDate()   ?? null,
      lastUpdated:      data.lastUpdated?.toDate()   ?? null,
      fraudCategories:  data.fraudCategories  ?? [],
      riskReasons:      data.riskReasons      ?? [],
      isBlacklisted:    data.isBlacklisted     ?? false,
    };
  },
};
