# SafeSignal Analytics Architecture

## 1. Overview
The SafeSignal Analytics layer provides dashboard-ready fraud intelligence without repeatedly scanning large collections. It aggregates data using Firestore's atomic increments as events happen, rather than running `.filter()` or `.reduce()` queries during reads.

## 2. Collections and Structures

All analytics data is stored inside the `analytics` collection, but distinguished using a document ID prefix pattern:

- `dashboard_summary` - Singleton document containing global totals.
- `daily_checks_YYYY-MM-DD` - Daily aggregate of risk checks.
- `daily_risk_YYYY-MM-DD` - Daily risk distribution.
- `daily_reports_YYYY-MM-DD` - Daily report moderation and submission counts.
- `daily_categories_YYYY-MM-DD` - Daily aggregation of fraud report categories.
- `daily_users_YYYY-MM-DD` - Daily user activity and new signups.

### 2.1 Event Collection for Idempotency
We use `events_{eventId}` documents inside the same `analytics` collection to record that a specific event has already been processed, preventing double counting on retries.

## 3. Aggregation Strategy

Whenever a significant action occurs (e.g., UPI Check, Report Submission, Moderation, User Login), the relevant backend Service triggers the `AnalyticsService`:

- **UPI Check**: Calls `recordCheck()` which increments daily check counters and dashboard check totals.
- **Report Submitted**: Calls `recordReportSubmitted()`.
- **Report Moderation**: Calls `recordReportApproved()` or `recordReportRejected()`.
- **User Actions**: Calls `recordUserCreated()` or `recordUserActivity()`.
- **UPI Intelligence**: Calls `recordBlacklistChange()`.

To ensure safe concurrent updates, all counter modifications use `FieldValue.increment()`. 

## 4. Time-Series Data

For time-series endpoints (`/api/v1/admin/analytics/checks?range=7d`), the system queries the `analytics` collection filtering on document IDs `__name__` between the computed start and end dates. 
If an expected date document does not exist, the `AnalyticsService` artificially injects it with `0` values to ensure frontend charts remain stable.

## 5. Security & Privacy

Normal users do not have access to any analytics data. Access is strictly governed through the `/api/v1/admin/analytics/*` routes, enforcing roles:
- Moderation & Checks Data: `ADMIN`, `MODERATOR`.
- Global Users & Dashboard Overview: `ADMIN`.

Analytics documents do not store PII (Personally Identifiable Information). They contain only aggregate numerical counters and metrics.

## 6. Backfill and Reconciliation

We provide `npm run analytics:backfill` and `npm run analytics:reconcile` scripts in `scripts/`:
- **Backfill**: Builds the global `dashboard_summary` by running `count()` on the source collections.
- **Reconciliation**: Validates that aggregated summary counters match actual document counts in source collections, ensuring consistency over time.
