# SafeSignal

**Real-Time UPI Fraud Detection & Pre-Transaction Risk Scorer**

SafeSignal is an end-to-end citizen intelligence and fraud defense platform designed to evaluate and prevent digital payment scams across India. Users can evaluate the risk of any UPI ID (VPA) before transacting, submit community fraud reports with tamper-proof evidence, and rely on real-time rule-based scoring coupled with an explainable Machine Learning inference pipeline.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Demo Credentials & RBAC Access](#demo-credentials--rbac-access)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation Guide](#installation-guide)
- [Running the Platform](#running-the-platform)
  - [1. Running the Backend API](#1-running-the-backend-api)
  - [2. Running the Frontend Portal](#2-running-the-frontend-portal)
  - [3. Running the ML Inference Service](#3-running-the-ml-inference-service)
- [Database Seeding & Provisioning](#database-seeding--provisioning)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Machine Learning Pipeline](#machine-learning-pipeline)
- [Database Schema and Collections](#database-schema-and-collections)
- [API Documentation](#api-documentation)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Troubleshooting & FAQs](#troubleshooting--faqs)
- [Deployment](#deployment)
- [Security Guidelines](#security-guidelines)
- [Project Status & Roadmap](#project-status--roadmap)

---

## Project Overview

SafeSignal helps mitigate digital payment fraud in India by assessing risk before payments take place:
1. **Citizens** check any UPI ID before scanning or paying, view detailed risk breakdowns (community reports, velocity flags, blacklist status), and report suspicious IDs.
2. **Moderators** inspect incoming fraud submissions, verify evidence, and approve or reject reports in real time.
3. **Administrators** control global risk engine thresholds, manage user privileges, enforce system-wide blacklists, and monitor audit trails and high-level fraud trends.

**Platform Status:**
- **Frontend:** Fully responsive React application integrated with Firebase Authentication, role-based route protection (`ADMIN`, `MODERATOR`, `USER`), and live backend connectivity.
- **Backend:** Modular Node.js / Express REST API with strict Zod validation, role authorization middleware, Cloud Firestore persistence, and automated daily analytics aggregation.
- **Machine Learning Microservice:** Python FastAPI service hosting a scikit-learn `RandomForestClassifier` trained for fraud scoring and feature importance estimation.

> **Disclaimer:** Risk scores are calculated risk indicators based on community reports, heuristic rules, and ML inference. They are not absolute guarantees of safety or fraud. SafeSignal does not access proprietary banking databases or NPCI internal ledgers.

---

## Demo Credentials & RBAC Access

The platform includes pre-configured demo credentials across all user roles for evaluation and testing. You can use these to sign in directly on the frontend (`/login`) or authenticate requests to the backend API:

| Role | Email | Password | Access & Responsibilities |
|---|---|---|---|
| **ADMIN** | `admin@safesignal.in` | `AdminPassword123!` | **Full Access:** Executive Dashboard (`/analytics`), Admin Console (`/admin`), Audit Log Viewer (`/history`), User Management, Global UPI Blacklisting, System Config overrides. |
| **MODERATOR** | `moderator@safesignal.in`<br>*(alias: `analyst@safesignal.in`)* | `ModeratorPassword123!` | **Moderation Queue:** Inspect user-submitted fraud reports, review evidence, approve/reject community reports, and view moderation counters. |
| **CITIZEN USER** | `user@safesignal.in` | `UserPassword123!` | **Public Portal:** UPI Risk Search (`/check`), fraud submission form, detailed risk timeline view, and personal check history. |

### Quick Sign-In on the Web Portal
On the `/login` page, you can either enter the credentials manually or click the interactive **Quick Demo Credentials** chips (`Admin`, `Moderator`, `Citizen User`) to instantly auto-fill the login form.

### Provisioning / Resetting Demo Accounts
To seed or refresh all demo accounts in both Firebase Authentication and Cloud Firestore, run:
```bash
cd backend
npm run seed:users
```
To dynamically update or grant any user a specific role:
```bash
cd backend
node scripts/setRole.js <user-email> [ADMIN|MODERATOR|USER]
```

---

## Key Features

| Feature | Description | Status |
|---|---|---|
| **UPI ID Normalization & Validation** | Cleans, lowercases, trims, and validates handles against known PSP providers (`@okaxis`, `@oksbi`, `@paytm`, `@ybl`, etc.). | Complete |
| **Rule-Based Risk Engine** | Multi-factor heuristic scoring analyzing report volume, age, recidivism, and blacklists. | Complete |
| **ML Fraud Predictor** | Random Forest model trained on feature vectors (report types, velocity, profile age) with explainable feature importance. | Complete |
| **Firebase Authentication** | Real-time token verification via Firebase Admin SDK with custom claims and status validation (`ACTIVE` / `BLOCKED`). | Complete |
| **Role-Based Access Control (RBAC)** | Multi-tier authorization enforcing least privilege for `USER`, `MODERATOR`, and `ADMIN`. | Complete |
| **Protected Frontend Routing** | React route guards (`ProtectedRoute`) redirecting unauthorized visitors based on claims. | Complete |
| **Community Fraud Reporting** | Citizen submission flow with category tags (phishing, investment scam, digital arrest, QR fraud) and evidence attachment. | Complete |
| **Moderation Workflow** | Approval/rejection queue with moderator attribution and automatic cache invalidation. | Complete |
| **Internal UPI Blacklist** | Administrator emergency kill-switch flagging UPI IDs with immediate score override (100 / CRITICAL). | Complete |
| **Audit Logging** | Append-only security ledger recording role updates, blacklisting, and status modifications. | Complete |
| **Automated Daily Analytics** | Aggregated fraud metrics, report distributions, and resolution velocity tracking. | Complete |

---

## Technology Stack

### Frontend
- **Framework:** React 18 with Vite 5
- **Routing:** React Router DOM v6
- **UI & Design:** Material UI (MUI v5), Emotion, Google Fonts (Plus Jakarta Sans, Inter)
- **Data Visualization:** Recharts
- **Authentication:** Firebase Client SDK (`firebase/auth`)

### Backend API
- **Runtime:** Node.js (>= 18.0.0)
- **Framework:** Express.js 4.19
- **Database & Identity:** Cloud Firestore & Firebase Admin SDK (v14.5.0)
- **Validation:** Zod 3.25
- **Security:** Helmet, CORS, Express Rate Limit, Bearer Token Extractor
- **Logging:** Morgan & Winston-compatible logger
- **Testing:** Vitest 5, Supertest 7

### Machine Learning Microservice
- **Language & Runtime:** Python 3.10+
- **Framework:** FastAPI, Uvicorn
- **Modeling:** Scikit-Learn (`RandomForestClassifier`), NumPy, Pandas, Joblib
- **API Security:** Static `X-API-KEY` token validation

---

## System Architecture

```mermaid
graph TD
    User([Browser / Citizen / Admin]) -->|HTTPS / UI| ReactApp[React Frontend (Vite)]
    ReactApp -->|Sign In / Get ID Token| FirebaseAuth[Firebase Auth Service]
    ReactApp -->|REST API + Bearer Token| ExpressBackend[Express API Gateway :5000]
    
    subgraph Backend Pipeline
        ExpressBackend --> AuthMW[authenticateFirebase Middleware]
        AuthMW --> RBACMW[authorizeRoles Middleware]
        RBACMW --> Controller[Route Controllers]
        Controller --> RiskService[Risk Engine Service]
        RiskService --> MLService[ML Microservice Client]
        RiskService --> Repo[Firestore Repositories]
    end

    MLService -->|POST /predict + X-API-KEY| FastAPIML[FastAPI ML Service :8001]
    FastAPIML --> Model[(Random Forest rf-v1.0.0)]
    Repo --> Firestore[(Cloud Firestore Database)]
```

---

## Project Structure

```
SafeSignal/
├── backend/                       # Express REST API
│   ├── docs/                      # Endpoint & Deployment Documentation
│   │   ├── admin-api.md
│   │   ├── analytics.md
│   │   ├── community-reporting.md
│   │   ├── render-deployment.md   # Production deployment guide
│   │   └── risk-engine.md
│   ├── scripts/                   # CLI & Seeding utilities
│   │   ├── backfillAnalytics.js
│   │   ├── createAdmin.js
│   │   ├── createDemoUsers.js     # Seeds Admin, Moderator, User
│   │   ├── reconcileAnalytics.js
│   │   ├── seedFirestore.js       # Bulk generates mock profiles & reports
│   │   └── setRole.js             # Updates role for any user email
│   ├── src/
│   │   ├── config/                # Constants, env loader, logger, Firebase Admin
│   │   ├── controllers/           # HTTP Request handlers
│   │   ├── middlewares/           # Auth, RBAC, Validation, Error Handling
│   │   ├── repositories/          # Cloud Firestore data access layer
│   │   ├── routes/                # Express routes (/api/v1/...)
│   │   ├── services/              # Core business logic & risk engine
│   │   ├── utils/                 # Token extractor, ApiError, permissions
│   │   ├── validators/            # Zod validation schemas
│   │   ├── app.js                 # Express application configuration
│   │   └── server.js              # Server entry point (:5000)
│   └── tests/                     # Vitest test suite (49 passing tests)
├── ml/                            # Python Machine Learning Microservice
│   ├── app/
│   │   ├── config.py              # ML app configuration
│   │   ├── feature_schema.py      # Feature engineering definitions
│   │   ├── main.py                # FastAPI endpoints (/health, /predict)
│   │   ├── predictor.py           # Model inference wrapper
│   │   └── schemas.py             # Pydantic request/response schemas
│   ├── data/                      # Synthetic training data & evaluation JSONs
│   ├── models/                    # Serialized model (.joblib) & metadata
│   ├── training/                  # Synthetic data generator & training scripts
│   ├── requirements.txt           # Python dependencies
│   └── README.md                  # Dedicated ML setup guide
├── src/                           # React Frontend Application
│   ├── components/                # ProtectedRoute, Navbar, Footer, UI components
│   ├── config/                    # Firebase client initialization
│   ├── context/                   # AppContext (Auth state, live claims, cache)
│   ├── pages/                     # Home, Check, Admin, Analytics, History, Login
│   ├── theme/                     # Material UI design system tokens
│   ├── App.jsx                    # Root router & role-protected route mapping
│   └── main.jsx                   # React DOM root
├── .env.local                     # Frontend environment variables
├── firestore.rules                # Cloud Firestore Security Rules
├── firestore.indexes.json         # Firestore Composite Indexes
├── firebase.json                  # Firebase deployment rules
└── package.json                   # Root package & Vite scripts
```

---

## Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Python:** v3.10 or higher (for the ML service)
- **Firebase Project:** With **Email/Password Authentication** and **Cloud Firestore** activated.

Verify installed runtimes:
```bash
node -v
npm -v
python --version
```

---

## Environment Configuration

### 1. Frontend Configuration (`.env.local`)
Create a `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API endpoint (Local or Deployed Render instance)
VITE_API_URL=http://localhost:5000
```

### 2. Backend Configuration (`backend/.env`)
Create `backend/.env` (refer to `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk...\n-----END PRIVATE KEY-----\n"

# ML Microservice URL
ML_SERVICE_URL=http://localhost:8001

# CORS Allowed Origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```
> **Note:** Preserve literal `\n` characters in `FIREBASE_PRIVATE_KEY`. SafeSignal's `env.js` automatically repairs common PEM formatting defects.

### 3. ML Service Configuration (`ml/.env` or defaults)
```env
PORT=8001
ML_API_KEY=dev_secret_key_123
```

---

## Installation Guide

### 1. Root / Frontend Dependencies
```bash
npm install
```

### 2. Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 3. ML Pipeline Dependencies
```bash
cd ml
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cd ..
```

---

## Running the Platform

To run the complete platform, start the three services in separate terminals:

### 1. Running the Backend API
```bash
cd backend
npm run dev
```
Runs at `http://localhost:5000`. Hot-reloading is enabled via `nodemon`.

### 2. Running the Frontend Portal
```bash
npm run dev
```
Runs at `http://localhost:5173`. Open in your browser to access the SafeSignal web application.

### 3. Running the ML Inference Service
```bash
cd ml
# Ensure .venv is activated
uvicorn app.main:app --reload --port 8001
```
Runs at `http://localhost:8001`. Test the health check endpoint at `http://localhost:8001/health`.

---

## Database Seeding & Provisioning

SafeSignal provides automated seed scripts to quickly prepare a local or staging environment:

1. **Provision Demo Accounts (Admin, Moderator, Citizen):**
   ```bash
   cd backend
   npm run seed:users
   ```
   Creates `admin@safesignal.in`, `moderator@safesignal.in`, and `user@safesignal.in` in Firebase Authentication and synchronizes their user profiles in Firestore.

2. **Seed Mock UPI Profiles & Community Reports:**
   ```bash
   cd backend
   npm run seed
   ```
   Generates 5,000 synthetic UPI profiles, 2,000 fraud reports, 10,000 check records, and 90 days of analytics in Firestore.

3. **Clear Seeded Collections:**
   ```bash
   npm run seed:clear
   ```

4. **Backfill or Reconcile Analytics:**
   ```bash
   npm run analytics:backfill
   npm run analytics:reconcile
   ```

---

## Role-Based Access Control (RBAC)

The system enforces a strict role hierarchy across both frontend routes and backend REST endpoints:

```
ADMIN  ──────►  MODERATOR  ──────►  USER
(Tier 3)        (Tier 2)           (Tier 1)
```

| Area | User | Moderator | Admin |
|---|:---:|:---:|:---:|
| Search UPI Risk (`/check`) | Yes | Yes | Yes |
| Submit Fraud Report (`POST /reports`) | Yes | Yes | Yes |
| View Own Submission History | Yes | Yes | Yes |
| Access Moderation Queue | - | Yes | Yes |
| Approve / Reject Reports | - | Yes | Yes |
| Moderation Dashboard Analytics | - | Yes | Yes |
| Executive Analytics (`/analytics`) | - | - | Yes |
| Admin Console (`/admin`) | - | - | Yes |
| Audit Trail Ledger (`/history`) | - | - | Yes |
| Blacklist / Unblacklist UPI IDs | - | - | Yes |
| Modify System Risk Thresholds | - | - | Yes |
| Block / Unblock User Accounts | - | - | Yes |

### RBAC Test Routes (Developer Verification)
The backend provides dedicated verification endpoints protected by role middleware:
- `GET /api/v1/test/user` — Accessible by `USER`, `MODERATOR`, and `ADMIN`.
- `GET /api/v1/test/moderator` — Accessible by `MODERATOR` and `ADMIN`.
- `GET /api/v1/test/admin` — Accessible exclusively by `ADMIN`.

---

## Machine Learning Pipeline

The SafeSignal ML service augments heuristic scoring with a trained Random Forest model:
- **Architecture:** `RandomForestClassifier` trained using scikit-learn.
- **Explainability:** Calculates real-time feature importance so the UI can explain *why* an ID was flagged (e.g., high dispute velocity, short account lifespan, scam category weighting).
- **Inference Latency:** Sub-20ms local prediction response.
- **Fallback Resilience:** If the ML service is offline, the Node.js backend smoothly degrades to rule-based heuristic scoring without interrupting user requests.

For full ML training commands, synthetic data generation, and evaluation metrics, see [docs/ml.md](docs/ml.md) and [ml/README.md](ml/README.md).

---

## Database Schema and Collections

SafeSignal utilizes Cloud Firestore as its primary data store:

- `users`: User profiles, role declarations (`USER`, `MODERATOR`, `ADMIN`), status (`ACTIVE`, `BLOCKED`), and aggregate counters.
- `upi_profiles`: UPI risk scores, risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), blacklist flags, and last checked timestamps.
- `reports`: Community fraud reports containing target UPI, evidence description, reporter UID, status (`PENDING`, `APPROVED`, `REJECTED`), and moderator UID.
- `check_history`: Audit records of pre-transaction checks performed by users.
- `analytics`: Daily aggregated metrics utilized by the administrative dashboards (`dailyChecks`, `fraudDetected`, etc.).
- `audit_logs`: Append-only compliance log recording sensitive actions (role elevation, account blocking, config changes).
- `system_config`: Dynamic weights and score thresholds for the risk engine.
- `ml_metadata`: Model versioning, hyperparameter definitions, and feature threshold mappings.

---

## API Documentation

The backend REST API is versioned under `/api/v1`. Comprehensive documentation for each module is available in `backend/docs/`:

| Module | Endpoints | Documentation Link |
|---|---|---|
| **Risk Engine** | `GET /api/v1/risk/check/:upiId` | [backend/docs/risk-engine.md](backend/docs/risk-engine.md) |
| **Community Reporting** | `POST /api/v1/reports`<br>`GET /api/v1/reports`<br>`PATCH /api/v1/reports/:id/approve` | [backend/docs/community-reporting.md](backend/docs/community-reporting.md) |
| **Admin & Moderation** | `GET /api/v1/admin/users`<br>`PATCH /api/v1/admin/users/:id/role`<br>`POST /api/v1/admin/upi/:id/blacklist` | [backend/docs/admin-api.md](backend/docs/admin-api.md) |
| **Analytics Reporting** | `GET /api/v1/admin/analytics/summary`<br>`GET /api/v1/admin/analytics/trends` | [backend/docs/analytics.md](backend/docs/analytics.md) |
| **Render Deployment** | Complete cloud setup guide | [backend/docs/render-deployment.md](backend/docs/render-deployment.md) |

---

## Testing & Quality Assurance

### Running Backend Unit & Integration Tests
The backend test suite is powered by **Vitest** and **Supertest**, covering validation, risk scoring logic, and RBAC endpoint protection:
```bash
cd backend
npm test
```
*Current test status: 49 passing tests across 4 test suites.*

### Running Backend Linting
```bash
cd backend
npm run lint
```

---

## Troubleshooting & FAQs

- **`401 Unauthorized` on API calls:** Ensure you are including a valid Firebase ID Token in the `Authorization: Bearer <token>` header. Firebase client tokens expire after 1 hour.
- **`403 Forbidden` on Protected Routes:** The user lacks the required role. Check the user's role in the Firestore `users` collection or run `node scripts/setRole.js <email> ADMIN`.
- **Firebase Private Key parsing error:** Make sure `FIREBASE_PRIVATE_KEY` in `backend/.env` has intact quotes and properly escaped `\n` characters. SafeSignal's `env.js` includes automated PEM recovery for common pasting issues.
- **Frontend redirects immediately to `/check` after login:** The signed-in account has role `USER` or `MODERATOR`. Routes like `/analytics`, `/admin`, and `/history` are reserved for `ADMIN`.

---

## Deployment

### Frontend (Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

### Backend (Render / Cloud Run)
The backend is structured to deploy smoothly on **Render** as a Web Service:
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- For a step-by-step checklist with environment variable configurations, refer to [backend/docs/render-deployment.md](backend/docs/render-deployment.md).

---

## Security Guidelines

- **Never commit `.env` or service account keys.**
- **Enforce Server-Side Authorization:** The frontend UI conditionally displays features, but the backend `authorizeRoles` and `authenticateFirebase` middlewares enforce true security.
- **Least-Privilege Firestore Rules:** `firestore.rules` ensures untrusted web clients cannot directly alter user roles, blacklists, or risk scores in Firestore.

---

## Project Status & Roadmap

- [x] **Phase 1-3:** Backend REST API Foundation & Firestore Data Access Layer
- [x] **Phase 4:** Heuristic Risk Engine & UPI Handle Normalization
- [x] **Phase 5:** Community Fraud Reporting & Moderation Queue
- [x] **Phase 6:** Administrative Dashboard, Audit Logging & Analytics Service
- [x] **Phase 6.5:** Frontend Firebase Authentication, Live Sign-In & Protected Routes
- [x] **Phase 7:** Analytics & Fraud Intelligence Layer
- [x] **Phase 8:** Machine Learning Inference Pipeline (FastAPI, Scikit-Learn Random Forest)
- [x] **Phase 9:** Intelligent Risk Fusion Engine (Score Fusion, Shadow Mode, Blacklist Overrides & Explainability)
- [ ] **Phase 10:** Integration with National Cyber Crime Reporting Portal (I4C) & bank registry feeds
