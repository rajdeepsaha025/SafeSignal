/**
 * repositories/ConfigRepository.js
 * Firestore operations for the `system_config` collection.
 *
 * Stores:
 *   - Risk scoring weights
 *   - Risk level thresholds
 *   - Feature flags
 *   - ML settings
 *
 * Document IDs are well-known keys (e.g. 'risk_weights', 'feature_flags').
 */

import { FieldValue } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/constants.js';

// Well-known config document IDs
export const CONFIG_KEYS = {
  RISK_WEIGHTS:    'risk_weights',
  RISK_THRESHOLDS: 'risk_thresholds',
  FEATURE_FLAGS:   'feature_flags',
  ML_SETTINGS:     'ml_settings',
  RATE_LIMITS:     'rate_limits',
};

class ConfigRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.SYSTEM_CONFIG);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────

  /**
   * Returns a specific config document by its key.
   * @param {string} key - CONFIG_KEYS.*
   * @returns {Promise<object|null>}
   */
  async get(key) {
    return this.findById(key);
  }

  /**
   * Returns all system configuration documents.
   * System config is small — safe to fetch in full.
   * @returns {Promise<object[]>}
   */
  async getAll() {
    const snap = await this.collection().get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  /**
   * Returns the risk scoring weights configuration.
   * @returns {Promise<object|null>}
   */
  async getRiskWeights() {
    return this.get(CONFIG_KEYS.RISK_WEIGHTS);
  }

  /**
   * Returns the feature flags configuration.
   * @returns {Promise<object|null>}
   */
  async getFeatureFlags() {
    return this.get(CONFIG_KEYS.FEATURE_FLAGS);
  }

  /**
   * Returns the ML service configuration.
   * @returns {Promise<object|null>}
   */
  async getMLSettings() {
    return this.get(CONFIG_KEYS.ML_SETTINGS);
  }

  // ─── Writes ──────────────────────────────────────────────────────────────────

  /**
   * Creates or updates a config document.
   * @param {string} key
   * @param {object} data
   */
  async set(key, data) {
    await this.doc(key).set(
      { ...data, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { id: key };
  }

  /**
   * Enables or disables a feature flag.
   * @param {string}  flagName
   * @param {boolean} enabled
   */
  async setFeatureFlag(flagName, enabled) {
    await this.doc(CONFIG_KEYS.FEATURE_FLAGS).set(
      {
        [flagName]: enabled,
        updatedAt:  FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export default new ConfigRepository();
