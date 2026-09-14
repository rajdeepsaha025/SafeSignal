/**
 * utils/firestoreHelpers.js
 * Shared Firestore utility helpers for transactions, batch writes, and pagination.
 *
 * Usage:
 *   import { runTransaction, batchWrite, paginateQuery } from '../utils/firestoreHelpers.js';
 */

import { firestore } from '../config/firebaseAdmin.js';
import { BATCH, PAGINATION } from '../config/constants.js';
import logger from '../config/logger.js';

// ─── Transaction Helper ────────────────────────────────────────────────────────

/**
 * Executes a Firestore transaction with automatic retry on contention.
 *
 * @template T
 * @param {(transaction: import('firebase-admin/firestore').Transaction) => Promise<T>} updateFn
 * @returns {Promise<T>}
 *
 * @example
 *   const result = await runTransaction(async (t) => {
 *     const doc = await t.get(ref);
 *     t.update(ref, { count: doc.data().count + 1 });
 *     return doc.data();
 *   });
 */
export async function runTransaction(updateFn) {
  if (!firestore) throw new Error('Firestore is not initialised');
  return firestore.runTransaction(updateFn);
}

// ─── Batch Write Helper ────────────────────────────────────────────────────────

/**
 * Executes an array of write operations in safe batches of up to BATCH.MAX_WRITE_SIZE.
 * Firestore hard-limits a single batch to 500 operations.
 *
 * @param {Array<{ ref: import('firebase-admin/firestore').DocumentReference, data: object, op: 'set'|'update'|'delete' }>} operations
 * @returns {Promise<void>}
 *
 * @example
 *   await batchWrite([
 *     { ref: db.collection('users').doc(id), data: { name: 'Alice' }, op: 'set' },
 *     { ref: db.collection('users').doc(id2), op: 'delete' },
 *   ]);
 */
export async function batchWrite(operations) {
  if (!firestore) throw new Error('Firestore is not initialised');
  if (!operations.length) return;

  const chunks = chunkArray(operations, BATCH.MAX_WRITE_SIZE);

  for (const chunk of chunks) {
    const batch = firestore.batch();

    for (const op of chunk) {
      switch (op.op) {
        case 'set':
          batch.set(op.ref, op.data, op.options ?? {});
          break;
        case 'update':
          batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
        default:
          logger.warn(`[batchWrite] Unknown operation: ${op.op}`);
      }
    }

    await batch.commit();
    logger.debug(`[batchWrite] Committed ${chunk.length} operations`);
  }
}

// ─── Pagination Helper ─────────────────────────────────────────────────────────

/**
 * Executes a paginated Firestore query using cursor-based pagination.
 *
 * @param {import('firebase-admin/firestore').Query}            query
 * @param {object}                                              options
 * @param {number}                                             [options.limit]       - Items per page
 * @param {import('firebase-admin/firestore').DocumentSnapshot} [options.startAfter] - Cursor doc
 * @returns {Promise<{ docs: any[]; lastDoc: import('firebase-admin/firestore').DocumentSnapshot|null; hasMore: boolean }>}
 *
 * @example
 *   const { docs, lastDoc, hasMore } = await paginateQuery(
 *     db.collection('reports').orderBy('createdAt', 'desc'),
 *     { limit: 20 }
 *   );
 */
export async function paginateQuery(query, { limit = PAGINATION.DEFAULT_LIMIT, startAfter } = {}) {
  const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  let q = query.limit(safeLimit + 1); // Fetch one extra to determine hasMore

  if (startAfter) {
    q = q.startAfter(startAfter);
  }

  const snapshot = await q.get();
  const docs = snapshot.docs;

  const hasMore = docs.length > safeLimit;
  const resultDocs = hasMore ? docs.slice(0, safeLimit) : docs;
  const lastDoc = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

  return { docs: resultDocs, lastDoc, hasMore };
}

/**
 * Offset-based pagination for REST API convenience (not recommended for huge datasets).
 * Prefer cursor-based pagination for collections > 10k documents.
 *
 * @param {import('firebase-admin/firestore').Query} query
 * @param {number} page  - 1-indexed page number
 * @param {number} limit - Items per page
 * @returns {Promise<{ docs: import('firebase-admin/firestore').DocumentSnapshot[]; total: null; page: number; limit: number }>}
 */
export async function offsetPaginate(query, page = 1, limit = PAGINATION.DEFAULT_LIMIT) {
  const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
  const offset = (Math.max(page, 1) - 1) * safeLimit;

  const snapshot = await query.offset(offset).limit(safeLimit).get();

  return {
    docs:  snapshot.docs,
    page,
    limit: safeLimit,
    total: null, // Firestore cannot count cheaply — let the caller decide
  };
}

// ─── Internal Utilities ────────────────────────────────────────────────────────

/**
 * Splits an array into chunks of at most `size` elements.
 * @template T
 * @param {T[]}    arr
 * @param {number} size
 * @returns {T[][]}
 */
export function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Converts a Firestore Timestamp or Date to a JS Date.
 * Returns null if the value is nullish.
 * @param {import('firebase-admin/firestore').Timestamp|Date|null} value
 * @returns {Date|null}
 */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  return null;
}

/**
 * Converts a JS Date to an ISO date string YYYY-MM-DD (UTC).
 * @param {Date} date
 * @returns {string}
 */
export function toDateString(date) {
  return date.toISOString().slice(0, 10);
}
