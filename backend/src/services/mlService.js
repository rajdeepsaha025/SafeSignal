import axios from 'axios';
import logger from '../config/logger.js';
import { env } from '../config/env.js';

class MLService {
  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
    this.apiKey = process.env.ML_SERVICE_API_KEY || 'dev_secret_key_123';
    this.timeoutMs = parseInt(process.env.ML_REQUEST_TIMEOUT_MS || '3000', 10);
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Fetches health status of the ML service.
   * @returns {Promise<object>}
   */
  async getHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.warn('[MLService] Health check failed:', { error: error.message });
      return { status: 'unavailable', model_loaded: false };
    }
  }

  /**
   * Requests a fraud prediction from the ML service.
   * @param {object} features - Feature vector
   * @returns {Promise<object>}
   */
  async predict(features) {
    try {
      const response = await this.client.post('/predict', { features });
      return {
        available: true,
        ...response.data
      };
    } catch (error) {
      logger.warn('[MLService] Prediction request failed:', { 
        error: error.message,
        code: error.code,
        status: error.response?.status
      });
      return {
        available: false,
        reason: error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'ML_SERVICE_UNAVAILABLE'
      };
    }
  }
}

export default new MLService();
