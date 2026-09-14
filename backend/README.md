# SafeSignal Backend

> India's Real-Time UPI Fraud Detection & Pre-Transaction Risk Scorer — Backend API

---

## Overview

SafeSignal Backend is a production-ready **Node.js + Express** REST API built on a **Firebase-first** architecture. It serves as the data and intelligence layer for the SafeSignal citizen-facing fraud intelligence platform, enabling:

- Community-sourced UPI fraud reports
- Rule-based and ML-powered risk scoring before payments
- Firebase Authentication-protected endpoints
- Cloud Firestore as the primary database

---

## Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js              # Centralised env validation & export
│   │   ├── firebaseAdmin.js    # Firebase Admin SDK initialisation
│   │   ├── logger.js           # Logging utility (console/file)
│   │   └── constants.js        # App-wide constants (no magic strings)
│   │
│   ├── middlewares/
│   │   ├── authenticate.js     # Firebase ID Token verification
│   │   ├── authorize.js        # Role-based access control (RBAC)
│   │   ├── errorHandler.js     # Centralised error middleware
│   │   ├── notFound.js         # 404 catch-all
│   │   ├── rateLimiter.js      # Global + strict rate limiters
│   │   └── validate.js         # Zod schema validation factory
│   │
│   ├── controllers/
│   │   └── healthController.js # GET /api/v1/health
│   │
│   ├── services/
│   │   └── index.js            # Service layer barrel (placeholder)
│   │
│   ├── repositories/
│   │   └── index.js            # Repository layer barrel (placeholder)
│   │
│   ├── routes/
│   │   ├── index.js            # Central route aggregator
│   │   └── healthRoutes.js     # Health check routes
│   │
│   ├── utils/
│   │   ├── ApiResponse.js      # Success response helper
│   │   ├── ApiError.js         # Custom error class
│   │   ├── asyncHandler.js     # Async route wrapper
│   │   └── dateUtils.js        # Date/time helpers
│   │
│   ├── validators/
│   │   └── index.js            # Zod schema definitions
│   │
│   ├── types/
│   │   └── index.js            # JSDoc type definitions
│   │
│   ├── app.js                  # Express app factory
│   └── server.js               # HTTP server entry point
│
├── config/
│   └── serviceAccountKey.json  # Firebase service account (NOT committed)
│
├── logs/                       # Production log files (auto-created)
├── .env                        # Active environment variables (NOT committed)
├── .env.example                # Environment variable template
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── package.json
└── README.md
```

---

## Architecture

SafeSignal follows a strict **Layered Architecture**:

```
Request
  ↓
Controller      ← Receives request, returns response only
  ↓
Service         ← Business logic, orchestration
  ↓
Repository      ← Firestore CRUD operations ONLY
  ↓
Firestore
```

**Rules:**
- Controllers **never** access Firestore directly
- Services **never** import Firestore — they call repositories
- Repositories are the **single point of truth** for all database access

---

## Installation

### Prerequisites

- **Node.js** >= 18.0.0
- A Firebase project with:
  - Cloud Firestore enabled
  - Firebase Authentication enabled
  - A Service Account key downloaded

### Steps

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy and configure environment variables
cp .env.example .env
# Edit .env and fill in your Firebase credentials

# 4. Start the development server
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key |
| `FIREBASE_STORAGE_BUCKET` | No | Firebase Storage bucket name |
| `JWT_SECRET` | No | Placeholder (Firebase Auth manages tokens) |
| `ML_SERVICE_URL` | No | URL of the ML microservice (default: http://localhost:8000) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

> **Tip:** In development, you can also place a `serviceAccountKey.json` in `backend/config/` and the app will use it automatically without needing env vars.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start with Nodemon (hot reload) |
| `start` | `npm run start` | Start in production mode |
| `lint` | `npm run lint` | Run ESLint |
| `format` | `npm run format` | Run Prettier formatter |

---

## API Reference

### Health Check

```
GET /api/v1/health
```

**Response (200 — Healthy):**
```json
{
  "success": true,
  "service": "SafeSignal Backend",
  "version": "1.0.0",
  "status": "healthy",
  "timestamp": "2026-07-06T12:00:00.000Z",
  "firebase": "connected"
}
```

**Response (500 — Firebase unavailable):**
```json
{
  "success": false,
  "service": "SafeSignal Backend",
  "version": "1.0.0",
  "status": "degraded",
  "timestamp": "2026-07-06T12:00:00.000Z",
  "firebase": "disconnected"
}
```

---

## Error Response Format

All errors follow a standardised format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    { "field": "upiId", "message": "Invalid UPI ID format" }
  ],
  "timestamp": "2026-07-06T12:00:00.000Z"
}
```

---

## Security

| Feature | Implementation |
|---|---|
| HTTP Security Headers | Helmet.js |
| CORS | Configurable allow-list |
| Rate Limiting | 100 req / 15 min (global) |
| Request Size | 10 MB limit |
| Authentication | Firebase ID Tokens |
| X-Powered-By | Hidden |

---

## Logging

| Environment | Output |
|---|---|
| `development` | Coloured console output |
| `production` | `logs/error.log` + `logs/access.log` (JSON lines) |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js LTS | Runtime |
| Express.js | HTTP framework |
| Firebase Admin SDK | Firestore, Auth, Storage |
| Cloud Firestore | Primary database |
| Zod | Schema validation |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| Morgan | HTTP request logging |
| dotenv | Environment management |
| Nodemon | Dev hot reload |
| ESLint + Prettier | Code quality |

---

## License

MIT © SafeSignal Team

---

## Phase 2 — Firestore Database Architecture

### Firestore Collections

| Collection | Doc ID | Purpose |
|---|---|---|
| `users` | Firebase UID | User profiles, roles, activity counters |
| `upi_profiles` | UPI ID string | Risk scores, community data per UPI ID |
| `reports` | UUID | Fraud reports submitted by citizens |
| `check_history` | UUID | Every risk check performed (audit trail) |
| `analytics` | YYYY-MM-DD | Daily aggregated platform statistics |
| `device_reputation` | SHA-256 hash | Per-device trust scores to combat abuse |
| `ml_metadata` | `current` | ML model version and performance metrics |
| `system_config` | Well-known key | Weights, thresholds, feature flags |
| `audit_logs` | Auto-ID | Immutable action log for all admin operations |

### Repository Layer

```
src/repositories/
├── BaseRepository.js       ← Abstract base with CRUD, batch, paginate, increment
├── UserRepository.js       ← users collection
├── UPIRepository.js        ← upi_profiles collection
├── ReportRepository.js     ← reports collection
├── HistoryRepository.js    ← check_history collection
├── AnalyticsRepository.js  ← analytics collection
├── DeviceRepository.js     ← device_reputation collection
├── ConfigRepository.js     ← system_config collection
├── AuditRepository.js      ← audit_logs collection (append-only)
└── index.js                ← Barrel export
```

### Firestore Data Converters

All Firestore reads/writes go through typed converters:

```
src/converters/
├── userConverter.js
├── upiProfileConverter.js
├── reportConverter.js
├── historyConverter.js
├── analyticsConverter.js
└── index.js
```

### Seeding

Generate realistic demo data:

```bash
# Seed all collections (preserves existing data)
npm run seed

# Clear all collections and re-seed
npm run seed:clear
```

**Seed counts:**

| Collection | Count |
|---|---|
| Users | 100 (5 admins, 10 moderators, 85 users) |
| UPI Profiles | 5,000 |
| Reports | 2,000 |
| Check History | 10,000 |
| Analytics | 90 days |
| Devices | 300 |

### Security Rules

Location: [`firestore.rules`](../firestore.rules) (project root)

| Collection | USER | MODERATOR | ADMIN |
|---|---|---|---|
| `users` | Own profile only | Own profile only | Full access |
| `upi_profiles` | Read only | Read only | Full access |
| `reports` | Create + own read | Read all + update status | Full access |
| `check_history` | Own read | Own read | Full access |
| `analytics` | ❌ | Read only | Full access |
| `device_reputation` | ❌ | ❌ | Full access |
| `ml_metadata` | ❌ | ❌ | Full access |
| `system_config` | ❌ | ❌ | Full access |
| `audit_logs` | ❌ | ❌ | Read only (no client writes ever) |

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Firestore Indexes

Location: [`firestore.indexes.json`](../firestore.indexes.json) (project root)

Key composite indexes:

| Collection | Fields | Direction |
|---|---|---|
| `reports` | `status` + `createdAt` | ASC, DESC |
| `reports` | `upiId` + `status` + `createdAt` | ASC, ASC, DESC |
| `reports` | `reporterUid` + `createdAt` | ASC, DESC |
| `upi_profiles` | `riskScore` + `lastUpdated` | DESC, DESC |
| `upi_profiles` | `riskLevel` + `riskScore` | ASC, DESC |
| `check_history` | `userId` + `timestamp` | ASC, DESC |
| `check_history` | `upiId` + `timestamp` | ASC, DESC |
| `analytics` | `date` | ASC |
| `audit_logs` | `userId` + `timestamp` | ASC, DESC |

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

### Firestore Utilities

Located in `src/utils/firestoreHelpers.js`:

| Helper | Description |
|---|---|
| `runTransaction(fn)` | Wraps Firestore transactions with automatic retry |
| `batchWrite(ops)` | Chunks operations into safe batches of ≤500 |
| `paginateQuery(q, opts)` | Cursor-based pagination (recommended for large sets) |
| `offsetPaginate(q, page, limit)` | Offset pagination for REST API convenience |
| `chunkArray(arr, size)` | Splits arrays into chunks |
| `toDate(value)` | Converts Firestore Timestamp → JS Date |
| `toDateString(date)` | Formats Date → YYYY-MM-DD |

---

## Phase 3 — Authentication & Authorization (RBAC)

### Auth Flow

```
Frontend (React)
    │
    │  Firebase Authentication → ID Token
    │
    ▼
Authorization: Bearer <Firebase_ID_Token>
    │
    ▼
authenticateFirebase middleware
    ├── Extract Bearer token
    ├── firebase.auth().verifyIdToken(token, checkRevoked=true)
    ├── Load Firestore user profile (create if first login)
    ├── Validate status (ACTIVE / BLOCKED)
    └── Attach enriched req.user
    │
    ▼
authorizeRoles(...roles) middleware
    └── Check req.user.role against allowed roles
    │
    ▼
Controller
```

> **Critical Security Rule:** Role is ALWAYS loaded from Firestore. Never trust `role` from the Firebase token.

### Authentication Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/auth/me` | Any authenticated user | Returns current user's Firestore profile |
| `POST` | `/api/v1/auth/sync` | Any authenticated user | Creates/syncs Firestore profile with Firebase user |

#### How to Send the Token (Frontend)

```javascript
// Get the ID token after Firebase login
const idToken = await firebase.auth().currentUser.getIdToken();

// Attach to every protected request
fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  },
});
```

#### GET /api/v1/auth/me — Response

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "uid": "firebase-uid",
    "email": "user@example.com",
    "displayName": "Aarav Sharma",
    "photoURL": "https://...",
    "role": "USER",
    "status": "ACTIVE",
    "totalChecks": 12,
    "totalReports": 3,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "lastLogin": "2026-07-06T18:00:00.000Z"
  },
  "timestamp": "2026-07-06T18:00:00.000Z"
}
```

### Role System

| Role | Permissions |
|---|---|
| `USER` | Check UPI, Submit report, View own history, View own profile |
| `MODERATOR` | All USER permissions + Approve/reject reports, View all reports, Community stats |
| `ADMIN` | All permissions — manage users, roles, config, audit logs, analytics |

### Protecting Routes

```javascript
import authenticateFirebase from '../middlewares/authenticate.js';
import authorizeRoles       from '../middlewares/authorize.js';
import { ROLES }            from '../config/constants.js';

// Any authenticated user
router.get('/profile', authenticateFirebase, handler);

// Moderators and admins only
router.get('/reports/pending',
  authenticateFirebase,
  authorizeRoles(ROLES.MODERATOR, ROLES.ADMIN),
  handler
);

// Admins only
router.delete('/user/:id',
  authenticateFirebase,
  authorizeRoles(ROLES.ADMIN),
  handler
);
```

### Error Responses

| HTTP | Scenario |
|---|---|
| `401` | Missing Authorization header |
| `401` | Invalid / malformed token |
| `401` | Expired token |
| `401` | Revoked token |
| `403` | Account is blocked |
| `403` | Insufficient role (RBAC violation) |

All errors follow the standard format:
```json
{
  "success": false,
  "message": "...",
  "errors": [],
  "timestamp": "2026-07-06T18:00:00.000Z"
}
```

### RBAC Test Routes

Verify the full auth pipeline without building feature APIs:

```bash
# Requires USER, MODERATOR, or ADMIN
GET /api/v1/test/user

# Requires MODERATOR or ADMIN
GET /api/v1/test/moderator

# Requires ADMIN only
GET /api/v1/test/admin
```

### New Files (Phase 3)

```
src/
├── middlewares/
│   ├── authenticate.js     ← Full Firebase token verification (replaced placeholder)
│   └── authorize.js        ← Full RBAC role checking (replaced placeholder)
├── services/
│   └── AuthService.js      ← Token verify → profile load/create → status check → audit
├── repositories/
│   └── AuthRepository.js   ← findByUid, createProfile, updateLastLogin, syncProfile
├── controllers/
│   ├── authController.js   ← getMe, syncProfile handlers
│   └── testController.js   ← Role verification test handlers
├── routes/
│   ├── authRoutes.js       ← GET /auth/me, POST /auth/sync
│   └── testRoutes.js       ← GET /test/user|moderator|admin
└── utils/
    ├── permissions.js      ← PERMISSIONS map, ROLE_PERMISSIONS, hasPermission()
    └── tokenExtractor.js   ← extractBearerToken, getClientIp, getUserAgent
```

### Automatic Profile Creation

On first login, the backend automatically creates a Firestore profile:

```json
{
  "uid": "<firebase-uid>",
  "email": "user@example.com",
  "displayName": "User Name",
  "photoURL": null,
  "role": "USER",
  "status": "ACTIVE",
  "totalChecks": 0,
  "totalReports": 0,
  "createdAt": "<server-timestamp>",
  "updatedAt": "<server-timestamp>",
  "lastLogin": "<server-timestamp>"
}
```

Role escalation (USER → MODERATOR → ADMIN) must be done through the Firebase Admin SDK or the admin dashboard — never through the auth flow.

---

## Phase 4 — Rule-Based Risk Intelligence Engine

### Overview
The Risk Intelligence Engine is a deterministic fraud evaluation layer that calculates risk for a given UPI ID based on community reports, report recency, velocity spikes, and blacklist status.

### Endpoint

```
POST /api/v1/check/score
```

**Access:** Protected (Any authenticated user)

**Rate Limiting:** 30 requests per 15 minutes per user.

**Request Body:**
```json
{
  "upiId": "merchant@oksbi"
}
```

### Risk Configuration

*   **Risk Score:** 0-100 (Bounded integer)
*   **Risk Level:** `LOW` (0-29), `MEDIUM` (30-69), `HIGH` (70-100)
*   **Confidence Level:** `LOW` (unknown), `MEDIUM` (1-4 reports), `HIGH` (5+ reports or blacklisted)

### Signals
*   **Verified Reports:** More `APPROVED` reports significantly increase the score.
*   **Community:** `PENDING` reports slightly increase the score. `REJECTED` reports do not increase the score.
*   **Recency:** Reports filed recently (< 24h) have stronger weight than older reports (> 30 days).
*   **Velocity:** Detects burst reporting activity, multiplying the risk.
*   **Blacklist:** If a UPI is listed as blacklisted, it overrides the score to 100.
