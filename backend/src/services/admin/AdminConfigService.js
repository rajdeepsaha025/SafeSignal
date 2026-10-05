import configRepository, { CONFIG_KEYS } from '../../repositories/ConfigRepository.js';
import auditRepository from '../../repositories/AuditRepository.js';
import { runTransaction } from '../../utils/firestoreHelpers.js';

class AdminConfigService {
  async getConfig() {
    const riskWeights = await configRepository.getRiskWeights() || {};
    const featureFlags = await configRepository.getFeatureFlags() || {};
    const riskThresholds = await configRepository.get(CONFIG_KEYS.RISK_THRESHOLDS) || {};

    return {
      riskWeights,
      featureFlags,
      riskThresholds
    };
  }

  async updateRiskConfig(updates, adminUid) {
    const { lowThreshold, mediumThreshold, weights, recency, velocity, confidence } = updates;
    
    // For MVP, risk config might be separated across different docs or in one doc.
    // Based on ConfigRepository:
    // RISK_WEIGHTS: 'risk_weights'
    // RISK_THRESHOLDS: 'risk_thresholds'
    
    const result = await runTransaction(async (t) => {
      const thresholdsRef = configRepository.doc(CONFIG_KEYS.RISK_THRESHOLDS);
      const weightsRef = configRepository.doc(CONFIG_KEYS.RISK_WEIGHTS);
      
      const [thresholdsDoc, weightsDoc] = await Promise.all([
        t.get(thresholdsRef),
        t.get(weightsRef)
      ]);
      
      const newThresholds = { ...thresholdsDoc.data() };
      if (lowThreshold !== undefined) newThresholds.lowThreshold = lowThreshold;
      if (mediumThreshold !== undefined) newThresholds.mediumThreshold = mediumThreshold;
      newThresholds.updatedAt = new Date();
      newThresholds.updatedBy = adminUid;
      
      const newWeights = { ...weightsDoc.data() };
      if (weights) newWeights.weights = weights;
      if (recency) newWeights.recency = recency;
      if (velocity) newWeights.velocity = velocity;
      if (confidence) newWeights.confidence = confidence;
      newWeights.updatedAt = new Date();
      newWeights.updatedBy = adminUid;
      
      // We could version it by writing to a system_config_history collection
      // but runTransaction doesn't have an easy way to write to a new doc unless we get a ref.
      
      t.set(thresholdsRef, newThresholds, { merge: true });
      t.set(weightsRef, newWeights, { merge: true });
      
      return { newThresholds, newWeights };
    });

    await auditRepository.log({
      userId: adminUid,
      action: 'CONFIG_UPDATED',
      resource: 'risk_configuration',
      metadata: {
        changedFields: Object.keys(updates)
      }
    });

    return result;
  }
}

export default new AdminConfigService();
