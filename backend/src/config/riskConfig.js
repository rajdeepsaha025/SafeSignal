/**
 * config/riskConfig.js
 * Configuration for the Rule-Based Risk Engine.
 * Contains thresholds, max scores, and multipliers.
 */

export const RISK_THRESHOLDS = {
  LOW: 29,    // 0-29
  MEDIUM: 69, // 30-69
  HIGH: 70,   // 70-100
};

export const CONFIDENCE_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

// Initial heuristic weights for MVP. 
// These must be calibrated against validated production data.
export const SIGNAL_WEIGHTS = {
  // Verified reports: non-linear scaling. E.g., 1 = 15, 2 = 30, 3 = 40, etc.
  VERIFIED_REPORTS: {
    MAX_SCORE: 60,
    BASE_WEIGHT: 15,
  },
  
  // Pending reports: small influence
  PENDING_REPORTS: {
    MAX_SCORE: 10,
    BASE_WEIGHT: 2,
  },

  // Velocity: multiplier based on volume over a timeframe
  VELOCITY: {
    TIMEFRAME_HOURS: 24,
    BURST_THRESHOLD: 10, // More than 10 reports in 24 hours is a burst
    MULTIPLIER: 1.5,     // If burst detected, multiply score by this
    MAX_SCORE: 30,
  },

  // Recency: time decay
  RECENCY: {
    LAST_24_HOURS_MULTIPLIER: 1.0,
    LAST_7_DAYS_MULTIPLIER: 0.8,
    LAST_30_DAYS_MULTIPLIER: 0.5,
    OLDER_MULTIPLIER: 0.2,
  },

  // Blacklist: immediate max score
  BLACKLIST: {
    SCORE: 100,
  }
};
