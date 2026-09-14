/**
 * converters/reportConverter.js
 * Firestore Data Converter for the `reports` collection.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { REPORT_STATUS } from '../config/constants.js';

/**
 * @typedef {Object} ReportDocument
 * @property {string}   id               - UUID document ID
 * @property {string}   upiId
 * @property {string}   reporterUid      - Firebase UID
 * @property {string}   fraudType        - FRAUD_TYPES.*
 * @property {string}   description
 * @property {string}   status           - REPORT_STATUS.*
 * @property {string[]} evidenceUrls
 * @property {number}   reporterReputation
 * @property {string}   [moderatedBy]    - Moderator UID
 * @property {Date}     [moderatedAt]
 * @property {Date}     createdAt
 * @property {Date}     updatedAt
 */

export const reportConverter = {
  toFirestore(report) {
    return {
      upiId:               report.upiId,
      reporterUid:         report.reporterUid,
      fraudType:           report.fraudType,
      description:         report.description         ?? '',
      status:              report.status              ?? REPORT_STATUS.PENDING,
      evidenceUrls:        report.evidenceUrls        ?? [],
      reporterReputation:  report.reporterReputation  ?? 50,
      moderatedBy:         report.moderatedBy         ?? null,
      moderatedAt:         report.moderatedAt         ?? null,
      createdAt:           report.createdAt           ?? FieldValue.serverTimestamp(),
      updatedAt:           FieldValue.serverTimestamp(),
    };
  },

  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      id:                  snapshot.id,
      upiId:               data.upiId,
      reporterUid:         data.reporterUid,
      fraudType:           data.fraudType,
      description:         data.description         ?? '',
      status:              data.status              ?? REPORT_STATUS.PENDING,
      evidenceUrls:        data.evidenceUrls        ?? [],
      reporterReputation:  data.reporterReputation  ?? 50,
      moderatedBy:         data.moderatedBy         ?? null,
      moderatedAt:         data.moderatedAt?.toDate()  ?? null,
      createdAt:           data.createdAt?.toDate()    ?? null,
      updatedAt:           data.updatedAt?.toDate()    ?? null,
    };
  },
};
