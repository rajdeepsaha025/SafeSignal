/**
 * converters/historyConverter.js
 * Firestore Data Converter for the `check_history` collection.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { RISK_LEVELS, CHECK_SOURCES } from '../config/constants.js';

/**
 * @typedef {Object} HistoryDocument
 * @property {string} id        - UUID document ID
 * @property {string} userId    - Firebase UID (or 'anonymous')
 * @property {string} upiId
 * @property {number} riskScore - 0–100
 * @property {string} riskLevel - RISK_LEVELS.*
 * @property {number} confidence - 0–1
 * @property {string} source    - CHECK_SOURCES.*
 * @property {Date}   timestamp
 */

export const historyConverter = {
  toFirestore(record) {
    return {
      userId:     record.userId    ?? 'anonymous',
      upiId:      record.upiId,
      riskScore:  record.riskScore  ?? 0,
      riskLevel:  record.riskLevel  ?? RISK_LEVELS.LOW,
      confidence: record.confidence ?? 1,
      source:     record.source     ?? CHECK_SOURCES.WEB,
      timestamp:  record.timestamp  ?? FieldValue.serverTimestamp(),
    };
  },

  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      id:         snapshot.id,
      userId:     data.userId    ?? 'anonymous',
      upiId:      data.upiId,
      riskScore:  data.riskScore  ?? 0,
      riskLevel:  data.riskLevel  ?? RISK_LEVELS.LOW,
      confidence: data.confidence ?? 1,
      source:     data.source     ?? CHECK_SOURCES.WEB,
      timestamp:  data.timestamp?.toDate() ?? null,
    };
  },
};
