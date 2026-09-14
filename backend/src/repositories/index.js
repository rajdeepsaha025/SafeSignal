/**
 * repositories/index.js
 * Repository layer — barrel export.
 *
 * ARCHITECTURE RULES:
 *   - Repositories are the ONLY layer that talks to Firestore.
 *   - Services call repositories; controllers never call repositories directly.
 *   - No business logic inside repositories — only Firestore operations.
 *
 * All repositories are singletons (exported as instances, not classes).
 */

export { default as userRepository }      from './UserRepository.js';
export { default as upiRepository }       from './UPIRepository.js';
export { default as reportRepository }    from './ReportRepository.js';
export { default as historyRepository }   from './HistoryRepository.js';
export { default as analyticsRepository } from './AnalyticsRepository.js';
export { default as deviceRepository }    from './DeviceRepository.js';
export { default as configRepository }    from './ConfigRepository.js';
export { default as auditRepository }     from './AuditRepository.js';
export { default as authRepository }      from './AuthRepository.js';

// Base class (for extending only — not a runtime singleton)
export { BaseRepository } from './BaseRepository.js';
