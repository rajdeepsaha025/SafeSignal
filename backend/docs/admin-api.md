# Admin & Moderator Management API Layer

This document outlines the administrative API surface for SafeSignal, exposing capabilities for Moderator report management, User management, UPI intelligence management, Blacklist management, System configuration, Audit log access, and Operational dashboards.

## Architecture & Permissions

The Admin API relies on the backend route protection using:
- **Authentication:** `authenticateFirebase` (verifies token, loads user profile)
- **Authorization:** `authorizeRoles(...roles)` (verifies role against Firestore data)
- **Validation:** `validate(schema)` (Zod-based request validation)

### Permission Matrix

| Operation | USER | MODERATOR | ADMIN |
|-----------|------|-----------|-------|
| Check UPI | YES | YES | YES |
| Submit report | YES | YES | YES |
| View own reports | YES | YES | YES |
| Moderate reports | NO | YES | YES |
| View all users | NO | NO | YES |
| Block user | NO | NO | YES |
| Change role | NO | NO | YES |
| View UPI intelligence | Limited/Public | Operational | Full |
| Blacklist UPI | NO | NO | YES |
| Configuration | NO | NO | YES |
| Audit logs | NO | Limited | YES |
| Dashboard | User data only | Moderation | Full operational |
| System health | NO | NO | YES |

---

## 1. User Management (ADMIN ONLY)

### List Users
`GET /api/v1/admin/users`
**Query Parameters:**
- `page`, `limit` (Pagination)
- `role`, `status`
- `search`, `createdAfter`, `createdBefore`

### Get User Details
`GET /api/v1/admin/users/:uid`

### Block User
`PATCH /api/v1/admin/users/:uid/block`
**Body:** `{ "reason": "string (min 10 chars)" }`

### Unblock User
`PATCH /api/v1/admin/users/:uid/unblock`

### Change Role
`PATCH /api/v1/admin/users/:uid/role`
**Body:** `{ "role": "MODERATOR" | "ADMIN" | "USER" }`
*Notes:* 
- Self-role demotion is forbidden.
- Removing the last active admin is forbidden.

---

## 2. UPI Intelligence (ADMIN ONLY)

### List UPI Profiles
`GET /api/v1/admin/upi`
**Query Parameters:**
- `page`, `limit`
- `riskLevel`, `isBlacklisted`
- `search`, `createdAfter`, `createdBefore`

### Get UPI Details
`GET /api/v1/admin/upi/:upiId`

### Update UPI Profile Note
`PATCH /api/v1/admin/upi/:upiId`
**Body:** `{ "administrativeNote": "string" }`
*Notes:* The Risk Score cannot be manually set. 

### Blacklist UPI
`POST /api/v1/admin/upi/:upiId/blacklist`
**Body:** `{ "reason": "string (min 10 chars)" }`

### Unblacklist UPI
`POST /api/v1/admin/upi/:upiId/unblacklist`
**Body:** `{ "reason": "string (min 10 chars)" }`

---

## 3. Configuration Management (ADMIN ONLY)

### Get System Configuration
`GET /api/v1/admin/config`
Returns risk thresholds, weights, and feature flags.

### Update Risk Configuration
`PATCH /api/v1/admin/config/risk`
**Body:** Fields to update (e.g., `lowThreshold`, `mediumThreshold`).

---

## 4. Audit Logs (ADMIN ONLY)

### List Audit Logs
`GET /api/v1/admin/audit-logs`
**Query Parameters:** `page`, `limit`, `action`, `actorUid`, `resourceType`, `startDate`, `endDate`

### Get Audit Log Details
`GET /api/v1/admin/audit-logs/:id`

---

## 5. Dashboards

### Moderator Dashboard Summary (MODERATOR, ADMIN)
`GET /api/v1/admin/moderation/summary`

### Admin Dashboard Summary (ADMIN ONLY)
`GET /api/v1/admin/dashboard/summary`

### System Health (ADMIN ONLY)
`GET /api/v1/admin/system/health`

---

## Error Handling

Standard SafeSignal error responses are used (e.g. 400/422 for validation, 401 for unauthenticated, 403 for unauthorized, 404 for not found, 409 for conflict).
