/**
 * services/index.js
 * Service layer — barrel export.
 *
 * Services contain all business logic.
 * They receive data from controllers and interact with repositories.
 * Never access Firestore directly from a service.
 */

export { default as authService } from './AuthService.js';
