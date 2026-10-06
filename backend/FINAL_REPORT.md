# Phase 7: Analytics + Fraud Intelligence Layer - Final Report

## 1. Files Created
- `src/constants/analyticsEvents.js`: Defines all events required for tracking analytics.
- `src/services/analytics/AnalyticsService.js`: Core service that implements idempotency and updates daily analytics using Firestore increments.
- `src/controllers/admin/AnalyticsController.js`: Express controller handling analytics endpoints.
- `src/validators/analyticsValidator.js`: Zod schema for validating analytics date ranges.
- `src/routes/adminAnalyticsRoutes.js`: Exposes new routes for analytics, correctly restricted by roles.
- `scripts/backfillAnalytics.js`: Initial backfill script to calculate total summary from source collections.
- `scripts/reconcileAnalytics.js`: Verification script to check for count mismatches between actual items and summarized aggregates.
- `docs/analytics.md`: Clear documentation of the analytics strategy, paths, security, and reconciliation.
- `tests/analytics.test.js`: Vitest file covering checks, high-risk flags, report submissions, duplicate prevention, and zero-filling logic for the Analytics Service.

## 2. Files Modified
- `src/repositories/AnalyticsRepository.js`: Entirely updated to support independent dashboard, checks, risks, categories, and users analytics documents.
- `src/routes/index.js`: Mounted the `adminAnalyticsRoutes` at `/admin/analytics`.
- `src/services/RiskService.js`: Added analytics logic to capture Check (total, risk-level, blacklist status) information asynchronously on every `checkRisk` operation.
- `src/services/ReportService.js`: Hooked up `recordReportSubmitted`.
- `src/services/ModerationService.js`: Hooked up `recordReportApproved` and `recordReportRejected`.
- `src/services/AuthService.js`: Connected `recordUserCreated` and `recordUserActivity`.
- `src/services/admin/AdminUPIService.js`: Linked `recordBlacklistChange`.
- `package.json`: Introduced `npm run analytics:backfill` and `npm run analytics:reconcile` tasks.

## 3. New Firestore Analytics Documents
The `analytics` collection structure includes:
- `dashboard_summary` (Singleton)
- `daily_checks_{YYYY-MM-DD}`
- `daily_risk_{YYYY-MM-DD}`
- `daily_reports_{YYYY-MM-DD}`
- `daily_categories_{YYYY-MM-DD}`
- `daily_users_{YYYY-MM-DD}`
- `events_{eventId}` (for enforcing event idempotency on restarts/retries)

## 4. New API Endpoints
All API endpoints follow SafeSignal's structured API response format (`{ success, data }`):
- `GET /api/v1/admin/analytics/overview` (ADMIN)
- `GET /api/v1/admin/analytics/moderation?range=7d` (MODERATOR, ADMIN)
- `GET /api/v1/admin/analytics/checks?range=7d` (MODERATOR, ADMIN)
- `GET /api/v1/admin/analytics/risk?range=30d` (MODERATOR, ADMIN)
- `GET /api/v1/admin/analytics/categories?range=30d` (MODERATOR, ADMIN)
- `GET /api/v1/admin/analytics/users?range=30d` (ADMIN)

## 5. Aggregation Strategy
- Using `FieldValue.increment()` to ensure atomic and safe concurrent transactions for counters.
- By segmenting data via `{prefix}_{YYYY-MM-DD}`, no read fetches rely on processing the entire history. Endpoints quickly retrieve ranges using Firestore `__name__` queries.
- Precomputed logic means normal dashboard queries issue negligible Firestore read counts.

## 6. Event/Idempotency Strategy
- Defined a `_runIdempotent(eventId)` method inside `AnalyticsService`.
- Crucial events pass unique deterministic IDs (like checkId, reportId, or `user_active_${userId}_${date}`).
- Before modifying analytics, the script creates/checks an `events_{eventId}` document to guarantee `exactly-once` increment tracking.

## 7. Dashboard Metrics
- Summarizes comprehensive real-time information: Active users, profiles, total reports, checked stats, pending/approved ratios, high-risk metrics, blacklist changes.

## 8. Firestore Read/Write Behavior
- Highly optimized. Submissions and checks generate a single extra write to the analytics daily document and events tracker.
- Time-series reads hit only exact matching documents representing exactly the requested date array (e.g., exactly 7 docs for 7 days), with no `.reduce()` over collections.

## 9. Backfill Strategy
- Available via `node scripts/backfillAnalytics.js --confirm`.
- Intelligently queries global sizes of tables (`USERS`, `UPI_PROFILES`, `REPORTS`) to generate a reliable total for `dashboard_summary`.

## 10. Reconciliation Strategy
- `node scripts/reconcileAnalytics.js` is available to safely map actual table constraints versus the stored summaries and warn the operators of any misaligned counters (mismatches).

## 11. Security Rules
- Fully restricted. `USER` roles cannot route to `/api/v1/admin/analytics/*`. Endpoints natively utilize `authorizeRoles()` validation matching ADMIN limits over User stats, and Moderation accessibility over Checks and Risk metrics.

## 12. Test Results
- Added complete coverage logic in `tests/analytics.test.js`.
- All SafeSignal core functionality tests continue passing (`vitest run` = 49 passed). No regressions introduced into the Risk, Moderation, and Community endpoints. 
- Analytics tracking is cleanly separated and executes asynchronously, ensuring primary requests never fail entirely if a transient analytics error occurs.

## 13. Migration Requirements
- In production/staging environments, execute `npm run analytics:backfill --confirm` to populate your `dashboard_summary`.

## 14. Human Review Required
- The script `backfillAnalytics.js` cannot precisely recreate chronological daily events (e.g., `daily_checks_2026-09-01`) without an extensive MapReduce pass over all events. Current execution restores only the global summary. Future events track completely autonomously inside the expected daily schemas. 
