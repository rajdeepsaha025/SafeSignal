# Community Fraud Reporting & Moderation

This document describes the workflow, architecture, and security rules for the SafeSignal Community Reporting system implemented in Phase 5.

## Architecture & Flow

### 1. Submission Flow (User)
- A `USER` submits a report via `POST /api/v1/reports`.
- The system normalizes the UPI ID.
- Duplicate checks enforce that a user cannot submit multiple reports for the same UPI ID within a 24-hour window.
- The report is written to Firestore (`reports` collection) with `status = PENDING`.
- The `upi_profiles` document is updated within a Firestore Transaction to increment `pendingReports`.
- An audit log is created (`REPORT_SUBMITTED`).
- *Note:* The `PENDING` report does NOT automatically cause a `HIGH` risk score.

### 2. Moderation Flow (Moderator / Admin)
- A `MODERATOR` or `ADMIN` fetches a paginated list of pending reports via `GET /api/v1/reports/pending`.
- They review the description, evidence, and history.
- They invoke `PATCH /api/v1/reports/:reportId/approve` or `/reject` with a `moderationReason`.

#### On Approve:
- Status changes to `APPROVED`.
- `verifiedReports` increments in the UPI profile; `pendingReports` decrements.
- The `fraudType` is appended to the UPI's `fraudCategories`.
- The Risk Score cache for this UPI is immediately invalidated.
- Audit log is created.

#### On Reject:
- Status changes to `REJECTED`.
- `rejectedReports` increments; `pendingReports` decrements.
- Risk Score is NOT increased.
- Audit log is created.

## Security & Anti-Abuse

1. **Authentication:** All reporting routes require Firebase Authentication.
2. **Rate Limiting:** 
   - `POST /reports` is heavily limited (5 requests / hour / IP).
   - Read/Moderation endpoints use standard/strict limits.
3. **Data Integrity:** 
   - Operations that touch both `reports` and `upi_profiles` use `firestore.runTransaction` to prevent partial updates or race conditions.
4. **Permissions (Firestore Rules):** 
   - Users can only read reports where `reporterUid == request.auth.uid`.
   - Client applications CANNOT write to `reports` directly; they must go through the Node.js backend.
5. **Storage Security:** 
   - Evidence can only be uploaded to `/reports/{reportId}/*`.
   - Max file size is 5MB, and only `image/*` and `application/pdf` are allowed.

## API Endpoints

- `POST /api/v1/reports` - Submit a new report.
- `GET /api/v1/reports/my` - Fetch current user's submitted reports.
- `GET /api/v1/reports/:reportId` - Fetch a specific report securely.
- `GET /api/v1/reports/pending` (Mod) - View pending reports.
- `PATCH /api/v1/reports/:reportId/approve` (Mod) - Approve report.
- `PATCH /api/v1/reports/:reportId/reject` (Mod) - Reject report.
