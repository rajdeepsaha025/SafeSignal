/**
 * config/fusionConfig.js
 * Configuration for the Phase 9 Intelligent Risk Fusion Engine.
 * Defines weights, thresholds, policy modes, and configuration validation.
 */

import { RISK_LEVELS } from './constants.js';

export const FUSION_ENGINE_VERSION = 'fusion-v1.0.0';
export const FUSION_CONFIG_VERSION = '1.0.0';

export const ML_SYNTHETIC_MODEL_POLICIES = {
  DISABLED: 'DISABLED',
  SHADOW: 'SHADOW',
  ENABLED: 'ENABLED',
};

// Initial engineering default weights: Rule = 0.70, ML = 0.30
// These are engineering defaults and not empirically validated optimal weights.
export const DEFAULT_FUSION_WEIGHTS = {
  RULE: 0.70,
  ML: 0.30,
};

// Default risk score bands (0–100)
// LOW: 0–24, MEDIUM: 25–49, HIGH: 50–74, CRITICAL: 75–100
export const DEFAULT_RISK_THRESHOLDS = {
  LOW: 24,
  MEDIUM: 49,
  HIGH: 74,
  CRITICAL: 100,
};

export const SUPPORTED_FEATURE_SCHEMA_VERSIONS = ['1.0'];

/**
 * Validates fusion configuration weights and thresholds.
 * @param {object} [config]
 * @returns {{ valid: boolean, errors: string[], cleanConfig: object }}
 */
export function validateFusionConfig(config = {}) {
  const errors = [];

  const ruleWeight = typeof config.ruleWeight === 'number' ? config.ruleWeight : DEFAULT_FUSION_WEIGHTS.RULE;
  const mlWeight = typeof config.mlWeight === 'number' ? config.mlWeight : DEFAULT_FUSION_WEIGHTS.ML;

  if (ruleWeight < 0 || mlWeight < 0 || !Number.isFinite(ruleWeight) || !Number.isFinite(mlWeight)) {
    errors.push('Weights must be non-negative finite numbers.');
  } else if (Math.abs((ruleWeight + mlWeight) - 1.0) > 0.001) {
    errors.push(`Weights must sum to 1.0 (got ${(ruleWeight + mlWeight).toFixed(3)}).`);
  }

  const thresholds = config.thresholds || DEFAULT_RISK_THRESHOLDS;
  const { LOW, MEDIUM, HIGH, CRITICAL } = thresholds;

  if (
    typeof LOW !== 'number' || typeof MEDIUM !== 'number' ||
    typeof HIGH !== 'number' || typeof CRITICAL !== 'number' ||
    LOW < 0 || LOW >= MEDIUM || MEDIUM >= HIGH || HIGH >= CRITICAL || CRITICAL > 100
  ) {
    errors.push('Thresholds must strictly satisfy 0 <= LOW < MEDIUM < HIGH <= CRITICAL <= 100.');
  }

  const syntheticPolicy = config.syntheticPolicy || process.env.ML_SYNTHETIC_MODEL_POLICY || ML_SYNTHETIC_MODEL_POLICIES.SHADOW;
  if (!Object.values(ML_SYNTHETIC_MODEL_POLICIES).includes(syntheticPolicy)) {
    errors.push(`Invalid ML_SYNTHETIC_MODEL_POLICY: "${syntheticPolicy}". Must be DISABLED, SHADOW, or ENABLED.`);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      cleanConfig: {
        ruleWeight: DEFAULT_FUSION_WEIGHTS.RULE,
        mlWeight: DEFAULT_FUSION_WEIGHTS.ML,
        thresholds: DEFAULT_RISK_THRESHOLDS,
        syntheticPolicy: ML_SYNTHETIC_MODEL_POLICIES.SHADOW,
      }
    };
  }

  return {
    valid: true,
    errors: [],
    cleanConfig: {
      ruleWeight,
      mlWeight,
      thresholds: { LOW, MEDIUM, HIGH, CRITICAL: CRITICAL || 100 },
      syntheticPolicy,
    }
  };
}
