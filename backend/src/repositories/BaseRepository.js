/**
 * repositories/BaseRepository.js
 * Abstract base repository — all feature repositories extend this class.
 *
 * Provides standard CRUD operations built on Firestore Admin SDK.
 * No business logic here — only database operations.
 *
 * Subclasses must provide:
 *   - this.collectionName  {string}
 *   - this.converter        {FirestoreConverter} (optional but recommended)
 */

import { FieldValue } from 'firebase-admin/firestore';
import { firestore } from '../config/firebaseAdmin.js';
import { batchWrite, paginateQuery, offsetPaginate } from '../utils/firestoreHelpers.js';
import logger from '../config/logger.js';

export class BaseRepository {
  /**
   * @param {string} collectionName - Firestore collection name (use COLLECTIONS.*)
   * @param {object} [converter]    - Optional Firestore data converter
   */
  constructor(collectionName, converter = null) {
    if (!collectionName) {
      throw new Error('BaseRepository: collectionName is required');
    }

    this.collectionName = collectionName;
    this.converter = converter;
  }

  /**
   * Returns a Firestore collection reference, optionally with a converter.
   * @returns {import('firebase-admin/firestore').CollectionReference}
   */
  collection() {
    const ref = firestore.collection(this.collectionName);
    return this.converter ? ref.withConverter(this.converter) : ref;
  }

  /**
   * Returns a typed document reference by ID.
   * @param {string} id
   * @returns {import('firebase-admin/firestore').DocumentReference}
   */
  doc(id) {
    return this.collection().doc(id);
  }

  // ─── Read Operations ─────────────────────────────────────────────────────────

  /**
   * Finds a single document by its ID.
   * Returns null if not found.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const snap = await this.doc(id).get();
    if (!snap.exists) return null;
    return this.converter ? snap.data() : { id: snap.id, ...snap.data() };
  }

  /**
   * Checks whether a document with the given ID exists.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    const snap = await this.doc(id).get();
    return snap.exists;
  }

  /**
   * Fetches all documents in the collection (paginated).
   * Avoid calling on collections > 1k documents — use queries instead.
   *
   * @param {object}  [options]
   * @param {number}  [options.limit]
   * @param {import('firebase-admin/firestore').DocumentSnapshot} [options.startAfter]
   * @returns {Promise<{ items: object[]; lastDoc: any; hasMore: boolean }>}
   */
  async findAll({ limit, startAfter } = {}) {
    const query = this.collection().orderBy('createdAt', 'desc');
    const { docs, lastDoc, hasMore } = await paginateQuery(query, { limit, startAfter });

    const items = docs.map((d) =>
      this.converter ? d.data() : { id: d.id, ...d.data() }
    );

    return { items, lastDoc, hasMore };
  }

  /**
   * Finds documents where a specific field equals a value.
   *
   * @param {string} field
   * @param {any}    value
   * @param {object} [options]
   * @param {number} [options.limit]
   * @param {import('firebase-admin/firestore').DocumentSnapshot} [options.startAfter]
   * @returns {Promise<{ items: object[]; lastDoc: any; hasMore: boolean }>}
   */
  async findByField(field, value, { limit, startAfter } = {}) {
    const query = this.collection().where(field, '==', value);
    const { docs, lastDoc, hasMore } = await paginateQuery(query, { limit, startAfter });

    const items = docs.map((d) =>
      this.converter ? d.data() : { id: d.id, ...d.data() }
    );

    return { items, lastDoc, hasMore };
  }

  /**
   * Offset-based pagination convenience method for REST APIs.
   * @param {object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @param {string} [options.orderBy]
   * @param {'asc'|'desc'} [options.direction]
   * @returns {Promise<{ items: object[]; page: number; limit: number }>}
   */
  async paginate({ page = 1, limit = 20, orderBy = 'createdAt', direction = 'desc' } = {}) {
    const query = this.collection().orderBy(orderBy, direction);
    const { docs, ...meta } = await offsetPaginate(query, page, limit);

    const items = docs.map((d) =>
      this.converter ? d.data() : { id: d.id, ...d.data() }
    );

    return { items, ...meta };
  }

  // ─── Write Operations ─────────────────────────────────────────────────────────

  /**
   * Creates a new document.
   * If `id` is provided, uses it as the document ID; otherwise Firestore auto-generates one.
   *
   * @param {object}  data
   * @param {string}  [id]  - Custom document ID
   * @returns {Promise<{ id: string }>}
   */
  async create(data, id = null) {
    const ref = id ? this.doc(id) : this.collection().doc();

    const payload = {
      ...data,
      createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await ref.set(payload);

    logger.debug(`[${this.collectionName}] Created document ${ref.id}`);
    return { id: ref.id };
  }

  /**
   * Updates an existing document (merges fields, does not replace).
   *
   * @param {string} id
   * @param {object} data
   * @returns {Promise<void>}
   */
  async update(id, data) {
    const payload = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await this.doc(id).update(payload);
    logger.debug(`[${this.collectionName}] Updated document ${id}`);
  }

  /**
   * Deletes a document by ID.
   *
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.doc(id).delete();
    logger.debug(`[${this.collectionName}] Deleted document ${id}`);
  }

  // ─── Batch Operations ─────────────────────────────────────────────────────────

  /**
   * Creates multiple documents in batched Firestore writes.
   * Automatically chunks at BATCH.MAX_WRITE_SIZE.
   *
   * @param {Array<{ id?: string; data: object }>} items
   * @returns {Promise<void>}
   */
  async batchCreate(items) {
    const operations = items.map(({ id, data }) => {
      const ref = id ? this.doc(id) : this.collection().doc();
      return {
        ref,
        data: {
          ...data,
          createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        op: 'set',
      };
    });

    await batchWrite(operations);
    logger.debug(`[${this.collectionName}] Batch created ${items.length} documents`);
  }

  /**
   * Updates multiple documents in batched Firestore writes.
   *
   * @param {Array<{ id: string; data: object }>} items
   * @returns {Promise<void>}
   */
  async batchUpdate(items) {
    const operations = items.map(({ id, data }) => ({
      ref:  this.doc(id),
      data: { ...data, updatedAt: FieldValue.serverTimestamp() },
      op:   'update',
    }));

    await batchWrite(operations);
    logger.debug(`[${this.collectionName}] Batch updated ${items.length} documents`);
  }

  /**
   * Increments a numeric field on a document atomically.
   *
   * @param {string} id
   * @param {string} field
   * @param {number} [delta] - Default 1
   * @returns {Promise<void>}
   */
  async increment(id, field, delta = 1) {
    await this.doc(id).update({
      [field]:   FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
